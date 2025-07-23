
// Stub hook to provide placeholder data where farmer data was previously used
export const useStubData = () => {
  return {
    farmer: {
      id: 'demo-farmer-001',
      name: 'Demo Farmer',
      mobile_number: '9876543210',
      village: 'Demo Village',
      district: 'Demo District',
      state: 'Demo State'
    },
    isLoading: false,
    error: null
  };
};
