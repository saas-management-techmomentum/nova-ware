
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { pagePermissionCategories, pagePermissionLabels, PagePermissions } from '@/hooks/usePagePermissions';

interface PageAccessPermissionsProps {
  permissions: PagePermissions;
  onPermissionChange: (permission: keyof PagePermissions, value: boolean) => void;
  disabled?: boolean;
}

const PageAccessPermissions = ({ permissions, onPermissionChange, disabled = false }: PageAccessPermissionsProps) => {
  const handleSwitchChange = (permission: keyof PagePermissions, checked: boolean) => {
    console.log('Switch clicked:', permission, 'new value:', checked);
    console.log('Current permissions before change:', permissions);
    onPermissionChange(permission, checked);
  };

  return (
    <div className="space-y-6 pointer-events-auto">
      <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Page Access Permissions</h3>
      
      {Object.entries(pagePermissionCategories).map(([categoryName, categoryPermissions]) => (
        <div key={categoryName} className="space-y-3 pointer-events-auto">
          <h4 className="text-md font-medium text-slate-300">{categoryName}</h4>
          
          <div className="grid grid-cols-1 gap-3 pl-4 pointer-events-auto">
            {categoryPermissions.map((permission) => (
              <div key={permission} className="flex items-center justify-between pointer-events-auto">
                <Label 
                  htmlFor={`permission-${permission}`} 
                  className="text-slate-300 text-sm cursor-pointer flex-1 pointer-events-auto"
                >
                  {pagePermissionLabels[permission as keyof PagePermissions]}
                </Label>
                <div className="flex-shrink-0 ml-4 pointer-events-auto">
                  <Switch
                    id={`permission-${permission}`}
                    checked={permissions[permission as keyof PagePermissions]}
                    onCheckedChange={(checked) => handleSwitchChange(permission as keyof PagePermissions, checked)}
                    disabled={disabled}
                    className="data-[state=checked]:bg-blue-600 pointer-events-auto"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="bg-blue-900/20 border border-blue-700 rounded-md p-3 pointer-events-auto">
        <p className="text-sm text-blue-300">
          💡 New employees have access to Inventory by default. Grant additional permissions as needed.
        </p>
      </div>
    </div>
  );
};

export default PageAccessPermissions;
