// Jazline Home Care - Brand Colors & Theme
export const Colors = {
  // Primary Colors - Calming Teal
  primary: '#009688',
  primaryLight: '#4DB6AC',
  primaryDark: '#00796B',
  primaryBg: '#E0F2F1',
  
  // Secondary Colors - Slate Grey
  secondary: '#607D8B',
  secondaryLight: '#90A4AE',
  secondaryDark: '#455A64',
  
  // Background
  background: '#FFFFFF',
  backgroundGrey: '#F5F5F5',
  backgroundLight: '#FAFAFA',
  
  // Text
  textPrimary: '#212121',
  textSecondary: '#757575',
  textLight: '#BDBDBD',
  
  // Functional Colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Trust Badge Colors
  certified: '#009688',
  authorized: '#00796B',
  bankBacked: '#1976D2',
  
  // Hybrid Feature Colors
  buy: '#2196F3',
  rent: '#009688',
  emi: '#1976D2',
};

export const Typography = {
  // Font Sizes
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  h5: 16,
  body: 14,
  caption: 12,
  small: 10,
  
  // Font Weights
  regular: '400' as any,
  medium: '500' as any,
  semibold: '600' as any,
  bold: '700' as any,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const TrustBadges = {
  clinicallySanitized: {
    label: 'Clinically Sanitized',
    icon: 'shield-checkmark',
    color: Colors.certified,
  },
  authorizedDealer: {
    label: 'Authorized Dealer',
    icon: 'ribbon',
    color: Colors.authorized,
  },
  bankBacked: {
    label: 'Bank-Backed Financing',
    icon: 'card',
    color: Colors.bankBacked,
  },
  maintenanceIncluded: {
    label: 'Maintenance on Us',
    icon: 'construct',
    color: Colors.success,
  },
};

export const ServiceIcons = {
  technician: 'build',
  pickup: 'car',
  videoDemo: 'videocam',
  installation: 'hammer',
};
