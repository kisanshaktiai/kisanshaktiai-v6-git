
// Simple hook to provide demo farmer data for components that need it
export const useSimpleFarmer = () => {
  return {
    farmer: {
      id: 'farmer-demo',
      farmer_code: 'DEMO001',
      mobile_number: '9876543210',
      full_name: 'Demo Farmer',
      village: 'Demo Village',
      district: 'Demo District',
      state: 'Demo State'
    }
  };
};
