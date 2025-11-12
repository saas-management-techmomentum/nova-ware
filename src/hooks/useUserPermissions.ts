export const useUserPermissions = () => {
  return {
    isUserAdmin: false,
    isUserManager: false,
    canAccessAllWarehouses: false,
    userWarehouseIds: [],
    isAdmin: false,
    userCompanyIds: [],
    userRoles: [],
    warehouseAssignments: [],
    canManageTimeTracking: false,
    isRegularEmployee: false,
    loading: false,
    permissions: {
      canViewFinancials: false,
      canEditFinancials: false,
      canManageUsers: false,
      canManageInventory: false,
    },
    assignUserToCompany: async () => {},
    assignUserToWarehouse: async () => {},
    getPrimaryCompanyId: () => null,
    getEffectiveWarehouseRole: () => 'employee',
    canUpdateTaskStatus: () => false,
    refreshPermissions: async () => {},
  };
};
