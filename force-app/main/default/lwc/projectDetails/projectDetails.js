// LWC core imports
import { LightningElement,api,track ,wire} from 'lwc';

// Apex method imports for data operations
import getTasksByProjectId from '@salesforce/apex/ProjectDataHander.getTasksByProjectId';
import getTeamMembersByProjectId from '@salesforce/apex/ProjectDataHander.getTeamMembersByProjectId';
import getAllEmployeesExcludingProjectMembers from '@salesforce/apex/ProjectDataHander.getAllEmployeesExcludingProjectMembers';
import updateTaskStatus from '@salesforce/apex/ProjectDataHander.updateTaskStatus';
import addEmployeeToProject from '@salesforce/apex/ProjectDataHander.addEmployeeToProject';
import removeEmployeeFromProject from '@salesforce/apex/ProjectDataHander.removeEmployeeFromProject';
import getProjectDetailsById from '@salesforce/apex/ProjectDataHander.getProjectDetailsById';

// Navigation imports
import { CurrentPageReference } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';

/**
 * ProjectDetails Component
 * Displays project information, tasks in a Kanban board, and manages team members.
 * Features include:
 * - Task management with drag-and-drop status updates
 * - Team member management (add/remove)
 * - Task filtering by priority, assignee, and search text
 */
export default class ProjectDetails extends LightningElement {
    
    // ============================================
    // PROPERTIES - Project & Task Data
    // ============================================
    
    projectId;                              // Current project ID from URL parameter
    @track projectName;                     // Project name for display
    @track totalTasks = 0;                  // Total task count
    @track tasks = [];                      // All tasks for the project
    @track completedTasks = 0;              // Count of completed tasks
    @track inProgressTasks = 0;             // Count of in-progress tasks
    @track notStartedTasks = 0;             // Count of not started tasks
    @track statusWithTasks = [];            // Tasks grouped by status for Kanban board
    
    // ============================================
    // PROPERTIES - Team Members
    // ============================================
    
    @track teamMembers = [];                // Current project team members
    @track totalTeamMembers = 0;            // Total team member count
    @track availableMembers = [];           // Employees available to add to project
    
    // ============================================
    // PROPERTIES - UI State & Selections
    // ============================================
    
    @track showManageMembersModal = false;  // Controls manage members modal visibility
    showTaskDetailsModal = false;           // Controls task details modal visibility
    selectedTaskId;                         // Currently selected task ID for details view
    draggedTaskId;                          // Task ID being dragged in Kanban board
    selectedRows = [];                      // Selected rows in available members table
    selectedProjectMemberRows = [];         // Selected rows in project members table
    
    // ============================================
    // PROPERTIES - Filters
    // ============================================
    
    @track searchKey = '';                  // Search text for filtering tasks
    selectedPriority;                       // Selected priority filter value
    selectedAssignee;                       // Selected assignee filter value

    // ============================================
    // WIRE - Get Project ID from URL
    // ============================================
    
    /**
     * Wire adapter to get project ID from URL parameters
     * Triggers data fetching when page reference is available
     */
    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.projectId = currentPageReference.state.c__projectId;
            console.log('Project ID in Details Component: ', this.projectId);
            
            // Fetch all required data for the project
            this.fetchTasks();
            this.fetchTeamMembers();
            this.fetchAllEmployeesExcludingProjectMembers();
            this.fetchProjectDetails();
        }
    }
    
    // ============================================
    // CONSTANTS - Status & Column Definitions
    // ============================================
    
    // Kanban board status columns
    status = ['Not Started', 'In Progress', 'Completed'];

    // Column definitions for team members datatable
    teamMemberColumns = [
        { label: 'Member Name', fieldName: 'memberName' },
        { label: 'Role', fieldName: 'role' },
        { label: 'Email', fieldName: 'email', type: 'email' }
    ];
    
    // Column definitions for available members datatable
    availableMemberColumns = [
        { label: 'Member Name', fieldName: 'Name' },
        { label: 'Role', fieldName: 'Role__c' },
        { label: 'Email', fieldName: 'Email__c', type: 'email' }
    ];

    // Fields to display in project details form
    projectFields = ['Name', 'Project_Name__c', 'Description__c', 'Start_Date__c', 'End_Date__c', 'Status__c', 'Milestone__c', 'Project_Manager__c'];

    // Priority filter options
    priorityOptions = [
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' }
    ];
    
    // ============================================
    // GETTERS - Computed Properties
    // ============================================
    
    /**
     * Generates assignee filter options from team members
     * @returns {Array} Options array with label (name) and value (employee ID)
     */
    get assigneeOptions() {
        const options = this.teamMembers.map(member => {
            return { label: member.memberName, value: member.employeeId };
        });
        console.log("assignee options", JSON.stringify(options));
        return options;
    }

    // ============================================
    // LIFECYCLE HOOKS
    // ============================================
    
    connectedCallback() {
        // Data fetching is handled by wire adapter
    }
    
    // ============================================
    // DATA FETCHING METHODS
    // ============================================
    
    /**
     * Fetches project details by ID and updates project name
     */
    async fetchProjectDetails() {
        try {
            const project = await getProjectDetailsById({ projectId: this.projectId });
            this.projectName = project.Project_Name__c;
            console.log('Project Details for Project ID ', this.projectId, ': ', JSON.stringify(project));
        } catch (error) {
            console.error('Error fetching project details for Project ID ', this.projectId, ': ', error);
        }
    }
    
    /**
     * Fetches all tasks for the current project
     * Updates task counts and groups tasks by status
     */
    async fetchTasks() {
        try {
            this.tasks = await getTasksByProjectId({ projectId: this.projectId });
            console.log('Tasks for Project ID ', this.projectId, ': ', JSON.stringify(this.tasks));
            
            // Group tasks for Kanban board display
            this.groupTasksByStatus();
            
            // Calculate task statistics
            this.totalTasks = this.tasks.length;
            this.completedTasks = this.tasks.filter(task => task.Status__c === 'Completed').length;
            this.inProgressTasks = this.tasks.filter(task => task.Status__c === 'In Progress').length;
            this.notStartedTasks = this.tasks.filter(task => task.Status__c === 'Not Started').length;
        } catch (error) {
            console.error('Error fetching tasks for Project ID ', this.projectId, ': ', error);
        }
    }
    
    /**
     * Fetches team members assigned to the current project
     * Maps data to include employee details for display
     */
    async fetchTeamMembers() {
        try {
            const data = await getTeamMembersByProjectId({ projectId: this.projectId });
            console.log("Data", JSON.stringify(data));
            
            // Map to flatten employee relationship data
            this.teamMembers = data.map(member => ({
                id: member.Id,                          // Project Member record ID
                employeeId: member.Employee__c,         // Employee record ID (for filtering)
                memberName: member.Employee__r?.Name,
                role: member.Employee__r?.Role__c,
                email: member.Employee__r?.Email__c
            }));
            
            console.log('Team Members for Project ID ', this.projectId, ': ', JSON.stringify(this.teamMembers));
            this.totalTeamMembers = this.teamMembers.length;
        } catch (error) {
            console.error('Error fetching team members for Project ID ', this.projectId, ': ', error);
        }
    }
    
    /**
     * Fetches employees not yet assigned to this project
     * Used for adding new team members
     */
    async fetchAllEmployeesExcludingProjectMembers() {
        try {
            this.availableMembers = await getAllEmployeesExcludingProjectMembers({ projectId: this.projectId });
            console.log('Employees excluding Project Members for Project ID ', this.projectId, ': ', JSON.stringify(this.availableMembers));
        } catch (error) {
            console.error('Error fetching employees excluding project members for Project ID ', this.projectId, ': ', error);
        }
    }
    
    // ============================================
    // KANBAN BOARD - Task Grouping & Display
    // ============================================
    
    /**
     * Groups tasks by their status for Kanban board display
     * Applies priority-based border styling to task cards
     */
    groupTasksByStatus() {
        this.statusWithTasks = this.status.map(status => {
            return {
                status: status,
                tasks: this.tasks
                    .filter(task => task.Status__c === status)
                    .map(task => ({
                        ...task,
                        cardClass: `kanban-card ${this.getBorderClassForStatus(task.Priority__c)}`
                    }))
            };
        });
        console.log('Status with Tasks: ', JSON.stringify(this.statusWithTasks));
    }
    
    /**
     * Returns CSS class for task card border based on priority
     * @param {String} priority - Task priority (High/Medium/Low)
     * @returns {String} CSS class name for border color
     */
    getBorderClassForStatus(priority) {
        switch (priority) {
            case 'High':
                return 'border-red';
            case 'Medium':
                return 'border-orange';
            case 'Low':
                return 'border-green';
            default:
                return '';
        }
    }
    
    // ============================================
    // DRAG AND DROP - Task Status Updates
    // ============================================
    
    /**
     * Handles drag start event - stores the dragged task ID
     */
    handleDragStart(event) {
        this.draggedTaskId = event.target.dataset.id;
        console.log("Event dataset:", JSON.stringify(event.target.dataset));
        console.log('Dragged Task ID: ', this.draggedTaskId);
    }
    
    /**
     * Handles drag over event - allows drop by preventing default
     */
    handleDragOver(event) {
        event.preventDefault();
    }
    
    /**
     * Handles drop event - updates task status via Apex
     */
    handleDrop(event) {
        event.preventDefault();
        const newStatus = event.currentTarget.dataset.status;
        console.log("Event dataset:", JSON.stringify(event.currentTarget.dataset));
        console.log('Dropped Task ID: ', this.draggedTaskId, ' to Status: ', newStatus);
        
        // Update task status in database
        updateTaskStatus({ taskId: this.draggedTaskId, newStatus: newStatus })
            .then(() => {
                console.log('Task status updated successfully');
                this.fetchTasks(); // Refresh task list
            })
            .catch(error => {
                console.error('Error updating task status: ', error);
            });
    }
    
    // ============================================
    // TASK EVENT HANDLERS
    // ============================================
    
    /**
     * Handles task card click - opens task details modal
     */
    handleTaskClick(event) {
        this.selectedTaskId = event.currentTarget.dataset.id;
        console.log('Task Clicked ID: ', this.selectedTaskId);
        if (this.selectedTaskId) {
            this.showTaskDetailsModal = true;
        }
    }
    
    /**
     * Handles task creation/update - refreshes task list
     */
    handleTaskCreated() {
        this.showTaskDetailsModal = false;
        this.fetchTasks();
    }
    
    // ============================================
    // TEAM MEMBER MANAGEMENT
    // ============================================
    
    /**
     * Opens the manage members modal
     */
    handleManageMembers() {
        this.showManageMembersModal = true;
    }
    
    /**
     * Closes the manage members modal
     */
    handleManageMembersClose() {
        this.showManageMembersModal = false;
    }
    
    /**
     * Handles row selection in available members table
     */
    handleRowSelection(event) {
        this.selectedRows = event.detail.selectedRows;
        console.log('Selected Rows: ', JSON.stringify(this.selectedRows));
    }
    
    /**
     * Adds selected employees to the project team
     */
    handleAddSelected() {
        if (this.selectedRows.length > 0) {
            const selectedEmployeeIds = this.selectedRows.map(row => row.Id);
            console.log("Selected Emp Ids:", selectedEmployeeIds);
            
            addEmployeeToProject({ projectId: this.projectId, employeeIds: selectedEmployeeIds })
                .then(() => {
                    console.log('Employee added to project successfully');
                    this.fetchTeamMembers();
                    this.fetchAllEmployeesExcludingProjectMembers();
                })
                .catch(error => {
                    console.error('Error adding employee to project: ', error);
                });
        }
    }
    
    /**
     * Handles row selection in project members table
     */
    handleProjectMemberRowSelection(event) {
        this.selectedProjectMemberRows = event.detail.selectedRows;
        console.log('Selected Project Member Rows: ', JSON.stringify(this.selectedProjectMemberRows));
    }
    
    /**
     * Removes selected members from the project team
     */
    handleRemoveSelected() {
        const selectedProjectMemberIds = this.selectedProjectMemberRows.map(row => row.id);
        console.log("Selected Project Member Ids to remove:", selectedProjectMemberIds);
        
        if (selectedProjectMemberIds.length > 0) {
            removeEmployeeFromProject({ projectMemberIds: selectedProjectMemberIds })
                .then(() => {
                    console.log('Employee(s) removed from project successfully');
                    this.fetchTeamMembers();
                    this.fetchAllEmployeesExcludingProjectMembers();
                })
                .catch(error => {
                    console.error('Error removing employee(s) from project: ', error);
                });
        }
    }
    
    /**
     * Closes the manage members modal (cancel button)
     */
    handleCancel() {
        this.showManageMembersModal = false;
    }
    
    // ============================================
    // PROJECT DETAILS FORM HANDLERS
    // ============================================
    
    /**
     * Handles project details form submission
     */
    handleProjectDetailsSubmit() {
        console.log("inside handleProjectDetailsSubmit");
        this.fetchProjectDetails();
    }
    
    /**
     * Handles successful project details update
     */
    handleProjectDetailsSuccess() {
        console.log("inside handleProjectDetailsSuccess");
        this.fetchProjectDetails();
    }
    
    // ============================================
    // SEARCH AND FILTER HANDLERS
    // ============================================
    

    handleSearchChange(event) {
        this.searchKey = event.target.value.toLowerCase();
        this.applyFilters();
    }

    handlePriorityChange(event) {
        this.selectedPriority = event.detail.value;
        console.log('Selected Priority: ', this.selectedPriority);
        this.applyFilters();
    }


    handleAssigneeChange(event) {
        this.selectedAssignee = event.detail.value;
        console.log('Selected Assignee: ', this.selectedAssignee);
        this.applyFilters();
    }


    applyFilters() {
        let filteredTasks = [...this.tasks];
        console.log("Filtered Tasks", JSON.stringify(filteredTasks));

        // Apply priority filter if selected
        if (this.selectedPriority) {
            filteredTasks = filteredTasks.filter(task => task.Priority__c === this.selectedPriority);
        }
        
        // Apply assignee filter if selected
        if (this.selectedAssignee) {
            filteredTasks = filteredTasks.filter(task => task.Assigned_to__c === this.selectedAssignee);
        }

        // Apply search filter if search text exists
        if (this.searchKey) {
            filteredTasks = filteredTasks.filter(task => {
                const taskName = task.Name?.toLowerCase() || '';
                const taskSubject = task.Subject__c?.toLowerCase() || '';
                const taskDescription = task.Description__c?.toLowerCase() || '';
                const assigneeName = task.Assigned_to__r?.Name?.toLowerCase() || '';
                
                return taskName.includes(this.searchKey) || 
                       taskSubject.includes(this.searchKey) || 
                       taskDescription.includes(this.searchKey) ||
                       assigneeName.includes(this.searchKey);
            });
        }

        // Group filtered tasks by status for Kanban display
        this.statusWithTasks = this.status.map(status => ({
            status,
            tasks: filteredTasks
                .filter(task => task.Status__c === status)
                .map(task => ({
                    ...task,
                    cardClass: `kanban-card ${this.getBorderClassForStatus(task.Priority__c)}`
                }))
        }));
    }

    /**
     * Clears all filters and resets to show all tasks
     */
    clearFilters() {
        this.searchKey = '';
        this.selectedPriority = null;
        this.selectedAssignee = null;
        this.groupTasksByStatus();
    }
    
}