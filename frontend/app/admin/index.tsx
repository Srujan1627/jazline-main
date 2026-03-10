import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = 'https://jazline-backend-v84.onrender.com/api';

interface Product {
  _id: string;
  name: string;
  category: string;
  selling_price?: number;
  rental_price_per_month?: number;
  security_deposit?: number;
  stock: number;
  description: string;
  image: string;
  mrp: number;
}

interface Order {
  _id: string;
  user_id: string;
  total: number;
  order_status: string;
  created_at: string;
  items: any[];
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'hybrid',
    mrp: '',
    selling_price: '',
    rental_price_per_month: '',
    security_deposit: '',
    stock: '',
    description: '',
    image: '',
  });

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleSaveProduct = async () => {
    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        product_type: 'equipment',
        mrp: parseFloat(formData.mrp) || 0,
        selling_price: parseFloat(formData.selling_price) || null,
        rental_price_per_month: parseFloat(formData.rental_price_per_month) || null,
        security_deposit: parseFloat(formData.security_deposit) || null,
        stock: parseInt(formData.stock) || 0,
        description: formData.description,
        image: formData.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzIxOTZGMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlByb2R1Y3Q8L3RleHQ+PC9zdmc+',
        whats_included: [],
        reviews: [],
        average_rating: 0,
        maintenance_included: true,
        sanitization_certified: true,
        emi_available: false,
        is_active: true,
        tags: [],
        best_for: '',
      };

      if (editingProduct) {
        await axios.put(`${API_URL}/admin/products/${editingProduct._id}`, productData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await axios.post(`${API_URL}/admin/products`, productData);
        Alert.alert('Success', 'Product created successfully');
      }

      resetForm();
      loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      mrp: product.mrp.toString(),
      selling_price: product.selling_price?.toString() || '',
      rental_price_per_month: product.rental_price_per_month?.toString() || '',
      security_deposit: product.security_deposit?.toString() || '',
      stock: product.stock.toString(),
      description: product.description,
      image: product.image,
    });
    setShowForm(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/admin/products/${productId}`);
            Alert.alert('Success', 'Product deleted successfully');
            loadProducts();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete product');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'hybrid',
      mrp: '',
      selling_price: '',
      rental_price_per_month: '',
      security_deposit: '',
      stock: '',
      description: '',
      image: '',
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            Orders
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Products Tab */}
        {activeTab === 'products' && (
          <View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <Text style={styles.addButtonText}>+ Add New Product</Text>
            </TouchableOpacity>

            {/* Product Form */}
            {showForm && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Product Name *"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />

                <View style={styles.pickerContainer}>
                  <Text style={styles.label}>Category *</Text>
                  <View style={styles.radioGroup}>
                    {['hybrid', 'buy_only', 'rent_only'].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={styles.radioOption}
                        onPress={() => setFormData({ ...formData, category: cat })}
                      >
                        <View style={styles.radio}>
                          {formData.category === cat && <View style={styles.radioSelected} />}
                        </View>
                        <Text style={styles.radioText}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="MRP *"
                  keyboardType="numeric"
                  value={formData.mrp}
                  onChangeText={(text) => setFormData({ ...formData, mrp: text })}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Selling Price"
                  keyboardType="numeric"
                  value={formData.selling_price}
                  onChangeText={(text) => setFormData({ ...formData, selling_price: text })}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Rental Price (per month)"
                  keyboardType="numeric"
                  value={formData.rental_price_per_month}
                  onChangeText={(text) =>
                    setFormData({ ...formData, rental_price_per_month: text })
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Security Deposit"
                  keyboardType="numeric"
                  value={formData.security_deposit}
                  onChangeText={(text) => setFormData({ ...formData, security_deposit: text })}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Stock *"
                  keyboardType="numeric"
                  value={formData.stock}
                  onChangeText={(text) => setFormData({ ...formData, stock: text })}
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description"
                  multiline
                  numberOfLines={4}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Image URL (optional)"
                  value={formData.image}
                  onChangeText={(text) => setFormData({ ...formData, image: text })}
                />

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
                    <Text style={styles.saveButtonText}>
                      {editingProduct ? 'Update' : 'Create'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Products List */}
            {loading ? (
              <ActivityIndicator size="large" color="#009688" style={styles.loader} />
            ) : (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>Name</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>Category</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>Price</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>Stock</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>Actions</Text>
                </View>
                {products.map((product) => (
                  <View key={product._id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{product.category}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>
                      ₹{product.selling_price || product.mrp}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{product.stock}</Text>
                    <View style={[styles.tableCell, styles.actions, { flex: 1 }]}>
                      <TouchableOpacity onPress={() => handleEditProduct(product)}>
                        <Text style={styles.editButton}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteProduct(product._id)}>
                        <Text style={styles.deleteButton}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Order ID</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>User ID</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Items</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Total</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Date</Text>
            </View>
            {orders.map((order) => (
              <View key={order._id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>
                  {order._id.slice(-8)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>
                  {order.user_id.slice(-8)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{order.items.length}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>₹{order.total}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{order.order_status}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
            {orders.length === 0 && (
              <Text style={styles.emptyText}>No orders found</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#009688',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#009688',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
  },
  activeTabText: {
    color: '#009688',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addButton: {
    backgroundColor: '#009688',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#009688',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#009688',
  },
  radioText: {
    fontSize: 14,
    color: '#333',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#009688',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#009688',
    padding: 12,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tableCell: {
    fontSize: 12,
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    color: '#009688',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    padding: 32,
    color: '#999',
  },
});
