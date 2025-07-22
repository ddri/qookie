// Design tokens for consistent styling
export const tokens = {
  // Spacing
  spacing: {
    xs: '4px',
    sm: '6px', 
    md: '8px',
    lg: '12px',
    xl: '16px'
  },
  
  // Border radius
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px'
  },
  
  // Typography
  fontSize: {
    xs: '12px',
    sm: '13px', 
    md: '14px',
    lg: '16px'
  },
  
  // Colors for light/dark mode
  colors: (darkMode) => ({
    // Primary (blue)
    primary: darkMode ? '#3b82f6' : '#2563eb',
    primaryHover: darkMode ? '#2563eb' : '#1d4ed8',
    primaryDisabled: darkMode ? '#374151' : '#6b7280',
    
    // Success (green) 
    success: darkMode ? '#10b981' : '#059669',
    successHover: darkMode ? '#059669' : '#047857',
    
    // Warning (orange)
    warning: darkMode ? '#f59e0b' : '#d97706',
    warningHover: darkMode ? '#d97706' : '#b45309',
    
    // Danger (red)
    danger: darkMode ? '#ef4444' : '#dc2626',
    dangerHover: darkMode ? '#dc2626' : '#b91c1c',
    
    // Neutral
    neutral: darkMode ? '#6b7280' : '#4b5563',
    neutralHover: darkMode ? '#4b5563' : '#374151',
    
    // Purple
    purple: darkMode ? '#8b5cf6' : '#7c3aed',
    purpleHover: darkMode ? '#7c3aed' : '#6d28d9',
    
    // Text colors
    text: darkMode ? '#f8fafc' : '#1e293b',
    textMuted: darkMode ? '#d1d5db' : '#6b7280',
    
    // Borders
    border: darkMode ? '#4b5563' : '#d1d5db',
    borderFocus: darkMode ? '#3b82f6' : '#2563eb'
  })
};

// Base button styles
const baseButton = (darkMode) => ({
  fontFamily: 'inherit',
  fontSize: tokens.fontSize.md,
  fontWeight: '500',
  border: `1px solid ${tokens.colors(darkMode).border}`,
  borderRadius: tokens.borderRadius.md,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: tokens.spacing.sm,
  outline: 'none',
  userSelect: 'none',
  
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.6
  }
});

// Button size variants
const buttonSizes = {
  sm: {
    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
    fontSize: tokens.fontSize.sm,
    minHeight: '32px'
  },
  md: {
    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
    fontSize: tokens.fontSize.md,
    minHeight: '36px'
  },
  lg: {
    padding: `${tokens.spacing.lg} ${tokens.spacing.xl}`,
    fontSize: tokens.fontSize.lg,
    minHeight: '44px'
  }
};

// Button variant styles
export const buttonStyles = (darkMode) => {
  const colors = tokens.colors(darkMode);
  
  return {
    // Primary button (blue)
    primary: (size = 'md', disabled = false) => ({
      ...baseButton(darkMode),
      ...buttonSizes[size],
      backgroundColor: disabled ? colors.primaryDisabled : colors.primary,
      color: colors.text,
      border: `1px solid ${disabled ? colors.primaryDisabled : colors.primary}`,
      
      '&:hover:not(:disabled)': {
        backgroundColor: colors.primaryHover,
        borderColor: colors.primaryHover,
        transform: 'translateY(-1px)'
      }
    }),
    
    // Success button (green)
    success: (size = 'md', disabled = false) => ({
      ...baseButton(darkMode),
      ...buttonSizes[size],
      backgroundColor: disabled ? colors.primaryDisabled : colors.success,
      color: 'white',
      border: `1px solid ${disabled ? colors.primaryDisabled : colors.success}`,
      
      '&:hover:not(:disabled)': {
        backgroundColor: colors.successHover,
        borderColor: colors.successHover,
        transform: 'translateY(-1px)'
      }
    }),
    
    // Warning button (orange)  
    warning: (size = 'md', disabled = false) => ({
      ...baseButton(darkMode),
      ...buttonSizes[size],
      backgroundColor: disabled ? colors.primaryDisabled : colors.warning,
      color: 'white',
      border: `1px solid ${disabled ? colors.primaryDisabled : colors.warning}`,
      
      '&:hover:not(:disabled)': {
        backgroundColor: colors.warningHover,
        borderColor: colors.warningHover,
        transform: 'translateY(-1px)'
      }
    }),
    
    // Danger button (red)
    danger: (size = 'md', disabled = false) => ({
      ...baseButton(darkMode),
      ...buttonSizes[size],
      backgroundColor: disabled ? colors.primaryDisabled : colors.danger,
      color: 'white',
      border: `1px solid ${disabled ? colors.primaryDisabled : colors.danger}`,
      
      '&:hover:not(:disabled)': {
        backgroundColor: colors.dangerHover,
        borderColor: colors.dangerHover,
        transform: 'translateY(-1px)'
      }
    }),
    
    // Purple button
    purple: (size = 'md', disabled = false) => ({
      ...baseButton(darkMode),
      ...buttonSizes[size],
      backgroundColor: disabled ? colors.primaryDisabled : colors.purple,
      color: 'white',
      border: `1px solid ${disabled ? colors.primaryDisabled : colors.purple}`,
      
      '&:hover:not(:disabled)': {
        backgroundColor: colors.purpleHover,
        borderColor: colors.purpleHover,
        transform: 'translateY(-1px)'
      }
    }),
    
    // Secondary button (outlined)
    secondary: (size = 'md', disabled = false) => ({
      ...baseButton(darkMode),
      ...buttonSizes[size],
      backgroundColor: 'transparent',
      color: disabled ? colors.textMuted : colors.text,
      border: `1px solid ${disabled ? colors.primaryDisabled : colors.border}`,
      
      '&:hover:not(:disabled)': {
        backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        borderColor: colors.borderFocus,
        transform: 'translateY(-1px)'
      }
    })
  };
};

// Helper function to create button styles easily
export const btn = (variant, size, disabled, darkMode) => {
  const styles = buttonStyles(darkMode);
  return styles[variant](size, disabled);
};