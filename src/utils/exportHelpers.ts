// Helper functions for exports

export const getStatusColorForExcel = (status: string): string => {
  switch (status) {
    case 'منجز': return '22C55E';
    case 'جاري': 
    case 'جاري العمل': return '3B82F6';
    case 'متأخر': return 'EF4444';
    case 'متقدم': return '16A34A';
    case 'متعثر': return 'DC2626';
    case 'متوقف': return '6B7280';
    case 'تم الرفع بالاستلام الابتدائي': return '9CA3AF';
    case 'تم الاستلام النهائي': return '059669';
    default: return '6B7280';
  }
};

export const getStatusColorForPDF = (status: string): string => {
  switch (status) {
    case 'منجز': return '#22c55e';
    case 'جاري': 
    case 'جاري العمل': return '#3b82f6';
    case 'متأخر': return '#ef4444';
    case 'متقدم': return '#16a34a';
    case 'متعثر': return '#dc2626';
    case 'متوقف': return '#6b7280';
    case 'تم الرفع بالاستلام الابتدائي': return '#9ca3af';
    case 'تم الاستلام النهائي': return '#059669';
    default: return '#6b7280';
  }
};
