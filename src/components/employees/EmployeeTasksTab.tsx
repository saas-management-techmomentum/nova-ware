import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarIcon,
  Plus,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Pause,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTasks } from "@/contexts/TasksContext";
import { TimeTrackingButtons } from "@/components/tasks/TimeTrackingButtons";
import { useEmployees } from "@/hooks/useEmployees";
import { useWarehouse } from "@/contexts/WarehouseContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { EmployeeStatusBadge } from "@/components/employees/EmployeeStatusBadge";
import ViewTaskModal from "@/components/tasks/ViewTaskModal";
import EditTaskModal from "@/components/tasks/EditTaskModal";
import { toast } from "sonner";

interface EmployeeTasksTabProps {
  canManageEmployees: boolean;
  onResendInvitation?: (employeeId: string) => void;
}

const EmployeeTasksTab: React.FC<EmployeeTasksTabProps> = ({ canManageEmployees, onResendInvitation }) => {
  const { tasks, isLoading, addTask, updateTask, deleteTask, startTask, pauseTask, resumeTask, completeTask, refetch } =
    useTasks();
  const { employees } = useEmployees();
  const { selectedWarehouse, canViewAllWarehouses } = useWarehouse();
  const { user } = useAuth();
  const { canManageTimeTracking, isRegularEmployee, getEffectiveWarehouseRole, canUpdateTaskStatus } =
    useUserPermissions();
  const { currentEmployee } = useCurrentEmployee();

  const isInCorporateOverview = canViewAllWarehouses && selectedWarehouse === null;

  // Filter employees by selected warehouse
  const warehouseFilteredEmployees = useMemo(() => {
    if (!selectedWarehouse) {
      // Corporate overview - show all employees
      return employees;
    }
    // Filter employees by assigned warehouse
    return employees.filter((emp) => emp.assigned_warehouse_id === selectedWarehouse);
  }, [employees, selectedWarehouse]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"all" | "unassigned" | string>("all");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    category: "",
    due_date: undefined as Date | undefined,
    assigned_to: "unassigned",
  });

  // Modal states
  const [viewTaskModal, setViewTaskModal] = useState<{ isOpen: boolean; task: any | null }>({
    isOpen: false,
    task: null,
  });
  const [editTaskModal, setEditTaskModal] = useState<{ isOpen: boolean; task: any | null }>({
    isOpen: false,
    task: null,
  });

  // Enhanced task filtering based on synchronized roles
  const { filteredTasks, taskCounts, employeeTaskData, myTasks } = useMemo(() => {
    let tasksToShow = tasks;
    const warehouseRole = selectedWarehouse ? getEffectiveWarehouseRole(selectedWarehouse) : null;

    // Enhanced role-based filtering
    if (!canManageEmployees || (warehouseRole === "employee" && selectedWarehouse)) {
      // Regular employees only see their assigned tasks
      const currentEmployee = employees.find((emp) => emp.user_id_auth === user.id);
      if (currentEmployee) {
        tasksToShow = tasks.filter((task) => task.assigned_to === currentEmployee.id);
      } else {
        tasksToShow = [];
      }
    } else if (warehouseRole === "manager" && selectedWarehouse) {
      // Warehouse managers see all tasks in their warehouse
      tasksToShow = tasks.filter((task) => task.warehouse_id === selectedWarehouse);
    }
    // Company admins and managers see all tasks (no additional filtering)

    const unassignedTasks = tasksToShow.filter((task) => !task.assigned_to);
    const assignedTasks = tasksToShow.filter((task) => task.assigned_to);
    const currentEmployee = employees.find((emp) => emp.user_id_auth === user?.id);
    const myTasks = currentEmployee ? tasksToShow.filter((task) => task.assigned_to === currentEmployee.id) : [];

    // Calculate task counts per employee (filtered by warehouse)
    const employeeTaskCounts = warehouseFilteredEmployees.reduce(
      (acc, employee) => {
        const employeeTasks = tasksToShow.filter((task) => task.assigned_to === employee.id);
        acc[employee.id] = {
          total: employeeTasks.length,
          completed: employeeTasks.filter((task) => task.status === "completed").length,
          pending: employeeTasks.filter((task) => task.status === "pending").length,
          inProgress: employeeTasks.filter((task) => task.status === "in_progress").length,
          cancelled: employeeTasks.filter((task) => task.status === "cancelled").length,
        };
        return acc;
      },
      {} as Record<
        string,
        { total: number; completed: number; pending: number; inProgress: number; cancelled: number }
      >,
    );

    // Filter tasks based on selected tab
    let filtered;
    if (!canManageEmployees) {
      // Employees only see their tasks
      filtered = myTasks;
    } else {
      if (selectedTab === "unassigned") {
        filtered = unassignedTasks;
      } else if (selectedTab === "all") {
        filtered = assignedTasks;
      } else {
        // Individual employee tab
        filtered = tasksToShow.filter((task) => task.assigned_to === selectedTab);
      }
    }

    return {
      filteredTasks: filtered,
      taskCounts: {
        all: assignedTasks.length,
        unassigned: unassignedTasks.length,
        my: myTasks.length,
      },
      employeeTaskData: employeeTaskCounts,
      myTasks,
    };
  }, [
    tasks,
    selectedTab,
    canManageEmployees,
    user,
    employees,
    warehouseFilteredEmployees,
    selectedWarehouse,
    getEffectiveWarehouseRole,
  ]);

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !selectedWarehouse) return;

    try {
      await addTask({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: "pending",
        due_date: newTask.due_date?.toISOString(),
        assigned_to: newTask.assigned_to === "unassigned" ? undefined : newTask.assigned_to,
        assigned_by: undefined,
        warehouse_id: selectedWarehouse,
        company_id: undefined,
      });

      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        category: "",
        due_date: undefined,
        assigned_to: "unassigned",
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleStatusChange = async (
    taskId: string,
    newStatus: "pending" | "in_progress" | "completed" | "cancelled",
  ) => {
    try {
      // Check if user can update this task
      const task = tasks.find((t) => t.id === taskId);
      const currentEmployee = employees.find((emp) => emp.user_id_auth === user?.id);

      if (!canManageEmployees && task?.assigned_to !== currentEmployee?.id) {
        console.error("User cannot update this task");
        return;
      }
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const warehouseRole = selectedWarehouse ? getEffectiveWarehouseRole(selectedWarehouse) : null;

    // Only admins and managers can delete tasks
    if (!canManageEmployees || warehouseRole === "employee") {
      console.error("User cannot delete tasks");
      return;
    }

    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleViewTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setViewTaskModal({ isOpen: true, task });
    }
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setEditTaskModal({ isOpen: true, task });
    }
  };

  const handleSaveEditTask = async (taskId: string, updates: any) => {
    try {
      await updateTask(taskId, updates);
      await refetch();
      setEditTaskModal({ isOpen: false, task: null });
      toast.success("Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
      throw error;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Pause className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee ? employee.name : "Unassigned";
  };

  const renderTasksContent = () => (
    <div className="space-y-4">
      {/* Employee Task Summary for non-managers */}
      {!canManageEmployees && (
        <div className="bg-neutral-800/50 p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{taskCounts.my}</div>
              <div className="text-sm text-neutral-400">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {myTasks.filter((t) => t.status === "completed").length}
              </div>
              <div className="text-sm text-neutral-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">
                {myTasks.filter((t) => t.status === "in_progress").length}
              </div>
              <div className="text-sm text-neutral-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">
                {myTasks.filter((t) => t.status === "cancelled").length}
              </div>
              <div className="text-sm text-neutral-400">Cancelled</div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Summary for individual employee tabs */}
      {canManageEmployees && selectedTab !== "all" && selectedTab !== "unassigned" && (
        <div className="bg-neutral-800/50 p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={employees.find((emp) => emp.id === selectedTab)?.avatar_url} />
              <AvatarFallback className="bg-neutral-700 text-white">
                {employees.find((emp) => emp.id === selectedTab)?.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                {employees.find((emp) => emp.id === selectedTab)?.name}
              </h3>
              <p className="text-sm text-neutral-400">{employees.find((emp) => emp.id === selectedTab)?.position}</p>
              <div className="mt-2">
                <EmployeeStatusBadge
                  employee={employees.find((emp) => emp.id === selectedTab)!}
                  onResendInvitation={onResendInvitation}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-white">{employeeTaskData[selectedTab]?.total || 0}</div>
                <div className="text-xs text-neutral-400">Total</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-400">{employeeTaskData[selectedTab]?.completed || 0}</div>
                <div className="text-xs text-neutral-400">Completed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-400">{employeeTaskData[selectedTab]?.inProgress || 0}</div>
                <div className="text-xs text-neutral-400">In Progress</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-400">{employeeTaskData[selectedTab]?.cancelled || 0}</div>
                <div className="text-xs text-neutral-400">Cancelled</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="h-16 w-16 mb-4 text-neutral-500" />
            <p className="text-lg font-medium mb-2 text-white">
              {!canManageEmployees
                ? "No Tasks Assigned"
                : selectedTab === "unassigned"
                  ? "No Unassigned Tasks"
                  : selectedTab === "all"
                    ? "No Tasks Yet"
                    : "No Tasks Assigned"}
            </p>
            <p className="text-sm text-neutral-400 text-center max-w-md">
              {!canManageEmployees
                ? "No tasks have been assigned to you yet."
                : selectedTab === "unassigned"
                  ? "All tasks have been assigned to employees."
                  : selectedTab === "all"
                    ? "Create your first employee task to get started with task management."
                    : `No tasks assigned to ${employees.find((emp) => emp.id === selectedTab)?.name || "this employee"}.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="bg-neutral-800 border-neutral-700 hover:bg-neutral-750 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(task.status)}
                      <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                      <Badge className={`${getPriorityColor(task.priority)} text-white capitalize`}>
                        {task.priority}
                      </Badge>
                    </div>

                    {task.description && <p className="text-neutral-300 mb-3">{task.description}</p>}

                    <div className="flex items-center gap-4 text-sm text-neutral-400">
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Due: {format(new Date(task.due_date), "MMM dd, yyyy")}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{getEmployeeName(task.assigned_to || "")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <TimeTrackingButtons
                      task={task}
                      canUpdateTaskStatus={canUpdateTaskStatus(task, currentEmployee?.id || null)}
                      warehouseId={selectedWarehouse}
                      onStart={startTask}
                      onPause={pauseTask}
                      onResume={resumeTask}
                      onComplete={completeTask}
                    />

                    {canManageEmployees && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-neutral-600 text-neutral-400 hover:text-white hover:bg-neutral-700/50"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-neutral-800 border-neutral-700">
                          <DropdownMenuItem
                            onClick={() => handleViewTask(task.id)}
                            className="text-neutral-300 hover:text-white hover:bg-neutral-700 cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Task
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditTask(task.id)}
                            className="text-neutral-300 hover:text-white hover:bg-neutral-700 cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Task
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-600/10 cursor-pointer"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Card className="bg-neutral-800 border-neutral-700">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-white">Loading tasks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Task Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{canManageEmployees ? "Task Management" : "My Tasks"}</h2>
        {!isInCorporateOverview && canManageEmployees && (
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showAddForm ? "Cancel" : "Add Task"}
          </Button>
        )}
      </div>

      {/* Inline Add Task Form */}
      {!isInCorporateOverview && canManageEmployees && showAddForm && (
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Add New Task</h3>
              </div>

              <div>
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="bg-neutral-700 border-neutral-600 text-white mt-1"
                  placeholder="Enter task title..."
                />
              </div>

              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-neutral-700 border-neutral-600 text-white mt-1",
                        !newTask.due_date && "text-neutral-400",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTask.due_date ? format(newTask.due_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700 z-50">
                    <Calendar
                      mode="single"
                      selected={newTask.due_date}
                      onSelect={(date) => setNewTask({ ...newTask, due_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                      setNewTask({ ...newTask, priority: value })
                    }
                  >
                    <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700 z-50">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newTask.category}
                    onValueChange={(value) => setNewTask({ ...newTask, category: value })}
                  >
                    <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white mt-1">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700 z-50">
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="shipping">Shipping</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="quality">Quality Control</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assigned_to">Assign To</Label>
                  <Select
                    value={newTask.assigned_to}
                    onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value })}
                  >
                    <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white mt-1">
                      <SelectValue placeholder="Select employee..." />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700 z-50">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {warehouseFilteredEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="bg-neutral-700 border-neutral-600 text-white mt-1"
                  placeholder="Enter task description..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddTask} className="bg-gray-800 hover:bg-gray-900">
                  Add Task
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Tabs or Simple Content */}
      {canManageEmployees ? (
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 overflow-hidden">
              {/* Horizontal scrollable tabs */}
              <div className="flex overflow-x-auto scrollbar-hide scroll-smooth bg-neutral-800/50 rounded-lg p-2 gap-2">
                <button
                  onClick={() => setSelectedTab("all")}
                  className={cn(
                    "px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 whitespace-nowrap min-w-fit",
                    selectedTab === "all"
                      ? "bg-neutral-700 text-white font-medium"
                      : "text-neutral-300 hover:bg-neutral-700/50 hover:text-white",
                  )}
                >
                  All Employees ({taskCounts.all})
                </button>

                <button
                  onClick={() => setSelectedTab("unassigned")}
                  className={cn(
                    "px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 whitespace-nowrap min-w-fit",
                    selectedTab === "unassigned"
                      ? "bg-neutral-700 text-white font-medium"
                      : "text-neutral-300 hover:bg-neutral-700/50 hover:text-white",
                  )}
                >
                  Unassigned ({taskCounts.unassigned})
                </button>

                {warehouseFilteredEmployees.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => setSelectedTab(employee.id)}
                    className={cn(
                      "px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 whitespace-nowrap min-w-fit",
                      selectedTab === employee.id
                        ? "bg-neutral-700 text-white font-medium"
                        : "text-neutral-300 hover:bg-neutral-700/50 hover:text-white",
                    )}
                  >
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={employee.avatar_url} />
                      <AvatarFallback className="text-xs bg-gray-700 text-white">{employee.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="max-w-24 truncate">{employee.name}</span>
                      <Badge
                        className={cn(
                          "text-xs px-1 py-0 h-4",
                          employee.role === "admin"
                            ? "bg-purple-600"
                            : employee.role === "manager"
                              ? "bg-gray-700"
                              : "bg-neutral-600",
                        )}
                      >
                        {employee.role || "employee"}
                      </Badge>
                    </div>
                    <span className="text-xs bg-neutral-600 px-2 py-1 rounded-full">
                      {employeeTaskData[employee.id]?.total || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Button variant="secondary" className="ml-4">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          <div className="space-y-4">{renderTasksContent()}</div>
        </Tabs>
      ) : (
        renderTasksContent()
      )}

      {/* Task Modals */}
      <ViewTaskModal
        task={viewTaskModal.task}
        isOpen={viewTaskModal.isOpen}
        onClose={() => setViewTaskModal({ isOpen: false, task: null })}
        getEmployeeName={getEmployeeName}
      />

      <EditTaskModal
        task={editTaskModal.task}
        isOpen={editTaskModal.isOpen}
        onClose={() => setEditTaskModal({ isOpen: false, task: null })}
        onSave={handleSaveEditTask}
        employees={employees}
      />
    </div>
  );
};

export default EmployeeTasksTab;
