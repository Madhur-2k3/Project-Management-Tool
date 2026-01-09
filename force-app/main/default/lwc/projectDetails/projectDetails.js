import { LightningElement,api,track ,wire} from 'lwc';
import getTasksByProjectId from '@salesforce/apex/ProjectDataHander.getTasksByProjectId';
import getTeamMembersByProjectId from '@salesforce/apex/ProjectDataHander.getTeamMembersByProjectId';
import getAllEmployeesExcludingProjectMembers from '@salesforce/apex/ProjectDataHander.getAllEmployeesExcludingProjectMembers';
import { CurrentPageReference } from 'lightning/navigation';

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

    get taskData() {
        return this.tasks;
    }
    get taskColumns() {
        return [
            { label: 'Task Name', fieldName: 'Name' },
            { label: 'Status', fieldName: 'Status__c' },
            { label: 'Priority', fieldName: 'Priority__c' },
            { label: 'Due Date', fieldName: 'Due_Date__c', type: 'date' }
        ];
    }

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
            this.teamMembers = await getTeamMembersByProjectId({ projectId: this.projectId });
            console.log('Team Members for Project ID ', this.projectId, ': ', JSON.stringify(this.teamMembers));
            this.totalTeamMembers = this.teamMembers.length;
        } catch (error) {
            console.error('Error fetching team members for Project ID ', this.projectId, ': ', error);
        }
    }
    async fetchAllEmployeesExcludingProjectMembers() {
        try {
            const employees = await getAllEmployeesExcludingProjectMembers({ projectId: this.projectId });
            console.log('Employees excluding Project Members for Project ID ', this.projectId, ': ', JSON.stringify(employees));
        } catch (error) {
            console.error('Error fetching employees excluding project members for Project ID ', this.projectId, ': ', error);
        }
    }

}