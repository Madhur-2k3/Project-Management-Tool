import { LightningElement,api,track ,wire} from 'lwc';
import getTasksByProjectId from '@salesforce/apex/ProjectDataHander.getTasksByProjectId';
import getTeamMembersByProjectId from '@salesforce/apex/ProjectDataHander.getTeamMembersByProjectId';
import getAllEmployeesExcludingProjectMembers from '@salesforce/apex/ProjectDataHander.getAllEmployeesExcludingProjectMembers';
import { CurrentPageReference } from 'lightning/navigation';
import updateTaskStatus from '@salesforce/apex/ProjectDataHander.updateTaskStatus';
import addEmployeeToProject from '@salesforce/apex/ProjectDataHander.addEmployeeToProject';

export default class ProjectDetails extends LightningElement {
    projectId;
    projectName
    @track totalTasks=0;
    @track tasks=[];
    @track completedTasks=0;
    @track inProgressTasks=0;
    @track notStartedTasks=0;
    @track searchKey='';
    @track teamMembers=[];
    @track totalTeamMembers=0;
    @track availableMembers=[];
    @track showManageMembersModal=false;
    @track statusWithTasks=[]
    draggedTaskId;
    selectedRows=[];


    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.projectId = currentPageReference.state.c__projectId;
            this.projectName = currentPageReference.state.c__projectName;
            console.log('Project ID in Details Component: ', this.projectId);
            this.fetchTasks();
            this.fetchTeamMembers();
            this.fetchAllEmployeesExcludingProjectMembers();
        }
    }
    status=['Not Started','In Progress','Completed'];

    // get taskData() {
    //     return this.tasks
    // }
    // get taskColumns() {
    //     return [
    //         { label: 'Task Name', fieldName: 'Name' },
    //         { label: 'Status', fieldName: 'Status__c' },
    //         { label: 'Priority', fieldName: 'Priority__c' },
    //         { label: 'Due Date', fieldName: 'Due_Date__c', type: 'date' }
    //     ];
    // }
    teamMemberColumns = [
        { label: 'Member Name', fieldName: 'memberName' },
        { label: 'Role', fieldName: 'role' },
        { label: 'Email', fieldName: 'email', type: 'email' }
    ];
    availableMemberColumns = [
        { label: 'Member Name', fieldName: 'Name' },
        { label: 'Role', fieldName: 'Role__c' },
        { label: 'Email', fieldName: 'Email__c', type: 'email' }
    ];

    connectedCallback() {
        // console.log('Project ID in Details Component: ', this.projectId);
        // this.fetchTasks();
        // this.fetchTeamMembers();
        // this.fetchAllEmployeesExcludingProjectMembers();
    }
    async fetchTasks() {
        try {
            this.tasks = await getTasksByProjectId({ projectId: this.projectId });
            console.log('Tasks for Project ID ', this.projectId, ': ', JSON.stringify(this.tasks));
            this.groupTasksByStatus();
            this.totalTasks = this.tasks.length;
            this.completedTasks = this.tasks.filter(task => task.Status__c === 'Completed').length;
            this.inProgressTasks = this.tasks.filter(task => task.Status__c === 'In Progress').length;
            this.notStartedTasks = this.tasks.filter(task => task.Status__c === 'Not Started').length;
        } catch (error) {
            console.error('Error fetching tasks for Project ID ', this.projectId, ': ', error);
        }
    }
    async fetchTeamMembers() {
        try {
            const data = await getTeamMembersByProjectId({ projectId: this.projectId });
            console.log("Data",JSON.stringify(data))
            this.teamMembers = data.map(member => ({
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
    async fetchAllEmployeesExcludingProjectMembers() {
        try {
            this.availableMembers = await getAllEmployeesExcludingProjectMembers({ projectId: this.projectId });
            console.log('Employees excluding Project Members for Project ID ', this.projectId, ': ', JSON.stringify(this.availableMembers));
        } catch (error) {
            console.error('Error fetching employees excluding project members for Project ID ', this.projectId, ': ', error);
        }
    }
    handleManageMembers(){
        this.showManageMembersModal = true;
    }
    groupTasksByStatus() {
        this.statusWithTasks = this.status.map(status => {
            return {
                status: status,
                tasks: this.tasks.filter(task => task.Status__c === status)
                        .map(task=>{
                            return{
                                ...task,
                                cardClass: `kanban-card ${this.getBorderClassForStatus(task.Priority__c)}`
                            }
                        })
               
            };
        });
        console.log('Status with Tasks: ', JSON.stringify(this.statusWithTasks));
    }
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
    handleDragStart(event) {
        this.draggedTaskId = event.target.dataset.id;   
        console.log("Event dataset:", JSON.stringify(event.target.dataset));
        console.log('Dragged Task ID: ', this.draggedTaskId);
    }
    handleDragOver(event) {
        event.preventDefault(); //allow drop
    }
    handleDrop(event){
        event.preventDefault();
        const newStatus = event.currentTarget.dataset.status
        console.log("Event dataset:", JSON.stringify(event.currentTarget.dataset));
        console.log('Dropped Task ID: ', this.draggedTaskId, ' to Status: ', newStatus);
        updateTaskStatus({ taskId: this.draggedTaskId, newStatus: newStatus })
        .then(() => {
            console.log('Task status updated successfully');
            // Refresh tasks after status update
            this.fetchTasks();
        })
        .catch(error => {
            console.error('Error updating task status: ', error);
        });
    }
    handleTaskCreated(){
        this.fetchTasks();
    }   
    handleManageMembersClose(){
        this.showManageMembersModal = false;
    }
    handleRowSelection(event){
        this.selectedRows = event.detail.selectedRows;
        console.log('Selected Rows: ', JSON.stringify(this.selectedRows));
        
    }
    handleAddSelected(){
        // You can process the selected rows as needed
        if(this.selectedRows.length > 0){
            // const selectedEmployeeId = this.selectedRows[0].Id;
            const selectedEmployeeIds = this.selectedRows.map(row => row.Id);
            console.log("Selected Emp Ids:",selectedEmployeeIds);
            
            console.log('Selected Employee ID: ', JSON.stringify(selectedEmployeeIds));
            addEmployeeToProject({projectId: this.projectId, employeeIds: selectedEmployeeIds})
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
}