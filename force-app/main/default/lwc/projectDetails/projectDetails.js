import { LightningElement,api,track } from 'lwc';
import getTasksByProjectId from '@salesforce/apex/ProjectDataHander.getTasksByProjectId';


export default class ProjectDetails extends LightningElement {
    @api projectId;
    @track totalTasks=0;
    @track tasks=[];
    @track completedTasks=0;
    @track inProgressTasks=0;
    @track notStartedTasks=0;
    @track searchKey='';
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
        console.log('Project ID in Details Component: ', this.projectId);
        this.fetchTasks();
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

}