"""
In-memory MongoDB-compatible database layer.
Drop-in replacement for motor's AsyncIOMotorClient collections
so the app works without MongoDB installed.
"""

from bson import ObjectId
from datetime import datetime
import copy
import re


class InMemoryCursor:
    """Mimics motor's AsyncIOMotorCursor."""
    def __init__(self, documents):
        self._documents = documents

    def sort(self, key, direction=-1):
        try:
            self._documents.sort(key=lambda d: d.get(key, datetime.min), reverse=(direction == -1))
        except TypeError:
            pass
        return self

    async def to_list(self, length=None):
        if length:
            return copy.deepcopy(self._documents[:length])
        return copy.deepcopy(self._documents)


class InMemoryCollection:
    """Mimics a motor collection with basic CRUD operations."""
    def __init__(self, name):
        self.name = name
        self._documents = []

    def _match(self, doc, query):
        """Simple query matcher supporting basic MongoDB operators."""
        for key, value in query.items():
            if key == "$and":
                return all(self._match(doc, sub_q) for sub_q in value)
            if key == "$or":
                return any(self._match(doc, sub_q) for sub_q in value)

            doc_val = doc.get(key)
            if isinstance(value, dict):
                for op, op_val in value.items():
                    if op == "$gt":
                        if doc_val is None or doc_val <= op_val:
                            return False
                    elif op == "$gte":
                        if doc_val is None or doc_val < op_val:
                            return False
                    elif op == "$lt":
                        if doc_val is None or doc_val >= op_val:
                            return False
                    elif op == "$lte":
                        if doc_val is None or doc_val > op_val:
                            return False
                    elif op == "$ne":
                        if doc_val == op_val:
                            return False
                    elif op == "$in":
                        if doc_val not in op_val:
                            return False
                    elif op == "$regex":
                        flags = value.get("$options", "")
                        re_flags = 0
                        if "i" in flags:
                            re_flags |= re.IGNORECASE
                        if not re.search(op_val, str(doc_val or ""), re_flags):
                            return False
            else:
                if doc_val != value:
                    return False
        return True

    async def insert_one(self, document):
        doc = copy.deepcopy(document)
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        self._documents.append(doc)

        class InsertResult:
            def __init__(self, id):
                self.inserted_id = id
        return InsertResult(doc["_id"])

    async def insert_many(self, documents):
        ids = []
        for document in documents:
            doc = copy.deepcopy(document)
            if "_id" not in doc:
                doc["_id"] = ObjectId()
            self._documents.append(doc)
            ids.append(doc["_id"])

        class InsertManyResult:
            def __init__(self, ids):
                self.inserted_ids = ids
        return InsertManyResult(ids)

    async def find_one(self, query=None):
        if query is None:
            query = {}
        for doc in self._documents:
            if self._match(doc, query):
                return copy.deepcopy(doc)
        return None

    def find(self, query=None):
        if query is None:
            query = {}
        matched = [copy.deepcopy(d) for d in self._documents if self._match(d, query)]
        return InMemoryCursor(matched)

    async def update_one(self, query, update):
        for doc in self._documents:
            if self._match(doc, query):
                if "$set" in update:
                    doc.update(update["$set"])
                if "$inc" in update:
                    for k, v in update["$inc"].items():
                        doc[k] = doc.get(k, 0) + v
                if "$push" in update:
                    for k, v in update["$push"].items():
                        if k not in doc:
                            doc[k] = []
                        doc[k].append(v)

                class UpdateResult:
                    modified_count = 1
                return UpdateResult()

        class UpdateResult:
            modified_count = 0
        return UpdateResult()

    async def delete_one(self, query):
        for i, doc in enumerate(self._documents):
            if self._match(doc, query):
                self._documents.pop(i)

                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()

        class DeleteResult:
            deleted_count = 0
        return DeleteResult()

    async def delete_many(self, query):
        original_len = len(self._documents)
        self._documents = [d for d in self._documents if not self._match(d, query)]

        class DeleteResult:
            deleted_count = original_len - len(self._documents) if hasattr(self, '_documents') else 0
        result = DeleteResult()
        result.deleted_count = original_len - len(self._documents)
        return result

    async def count_documents(self, query=None):
        if query is None:
            query = {}
        return sum(1 for d in self._documents if self._match(d, query))


class InMemoryDatabase:
    """Mimics motor's database, auto-creates collections."""
    def __init__(self, name="jazline"):
        self.name = name
        self._collections = {}

    def __getattr__(self, name):
        if name.startswith("_"):
            return super().__getattribute__(name)
        if name not in self._collections:
            self._collections[name] = InMemoryCollection(name)
        return self._collections[name]

    def __getitem__(self, name):
        return self.__getattr__(name)


class InMemoryClient:
    """Mimics motor's AsyncIOMotorClient."""
    def __init__(self):
        self._databases = {}

    def __getitem__(self, name):
        if name not in self._databases:
            self._databases[name] = InMemoryDatabase(name)
        return self._databases[name]

    def close(self):
        pass
