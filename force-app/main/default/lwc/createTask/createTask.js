import { LightningElement, api, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import TASK_OBJECT from '@salesforce/schema/Task__c';
import getParentTasks from '@salesforce/apex/TaskController.getParentTasks';
import getProjectEmployees from '@salesforce/apex/TaskController.getProjectEmployees';

export default class CreateTask extends LightningElement {
    @api recordId;
    @api projectId;
    @track showModal = false;
    @track showForm = false;
    @track selectedTaskType = '';
    @track recordTypeId = '';
    @track selectedParentTaskId = '';
    @track parentTaskOptions = [];
    @track isLoadingParentTasks = false;
    @track selectedEmployeeId = '';
    @track employeeOptions = [];
    @track isLoadingEmployees = false;
    
    recordTypeMap = {};

    // Task type options - will be populated from Record Types
    @track taskTypeOptions = [];

    // Base fields without Parent Task (for Epic)
    baseFields = ['Name', 'Description__c', 'Due_Date__c', 'Priority__c', 'Status__c', 'Assigned_to__c'];
    
    // All fields including Parent Task (for Story, Bug, Sub-Task)
    allFields = ['Name', 'Description__c', 'Due_Date__c', 'Priority__c', 'Status__c', 'Assigned_to__c', 'Sub_Task__c'];

    // Fetch Record Types for Task__c
    @wire(getObjectInfo, { objectApiName: TASK_OBJECT })
    wiredObjectInfo({ error, data }) {
        if (data) {
            const recordTypes = data.recordTypeInfos;
            this.taskTypeOptions = [];
            this.recordTypeMap = {};
            
            Object.keys(recordTypes).forEach(rtId => {
                const rt = recordTypes[rtId];
                if (rt.available && !rt.master) {
                    this.taskTypeOptions.push({
                        label: rt.name,
                        value: rt.name
                    });
                    this.recordTypeMap[rt.name] = rtId;
                }
            });
            
            // Fallback if no record types configured
            if (this.taskTypeOptions.length === 0) {
                this.taskTypeOptions = [
                    { label: 'Epic', value: 'Epic' },
                    { label: 'Story', value: 'Story' },
                    { label: 'Bug', value: 'Bug' },
                    { label: 'Sub-Task', value: 'Sub-Task' }
                ];
            }
        } else if (error) {
            console.error('Error fetching record types:', error);
        }
    }

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            if (!this.recordId) {
                this.recordId = currentPageReference.attributes.recordId 
                    || currentPageReference.state.recordId;
            }
            console.log('Resolved Record Id -> ', this.recordId);
        }
    }

    // Getter for form fields based on task type
    get formFields() {
        // Epic tasks don't have a parent task
        if (this.selectedTaskType === 'Epic') {
            return this.baseFields;
        }
        return this.allFields;
    }

    // Getter to check if Parent Task field should be shown
    get showParentTaskField() {
        return this.selectedTaskType !== 'Epic';
    }

    // Getter for Project Id to pre-populate
    get projectIdValue() {
        return this.recordId || this.projectId;
    }

    // Getter to disable Next button if no type selected
    get isNextDisabled() {
        return !this.selectedTaskType;
    }

    handleCreateTask() {
        console.log('Task creation logic triggered', this.recordId);
        this.showModal = true;
        this.showForm = false;
        this.selectedTaskType = '';
        this.selectedParentTaskId = '';
        this.parentTaskOptions = [];
        this.selectedEmployeeId = '';
        this.employeeOptions = [];
    }

    handleTaskTypeChange(event) {
        this.selectedTaskType = event.detail.value;
        this.recordTypeId = this.recordTypeMap[this.selectedTaskType] || '';
    }

    handleNext() {
        if (this.selectedTaskType) {
            this.showForm = true;
            // Fetch parent tasks for non-Epic types
            if (this.selectedTaskType !== 'Epic') {
                this.fetchParentTasks();
            }
            // Fetch employees for the project
            this.fetchProjectEmployees();
        }
    }

    fetchProjectEmployees() {
        this.isLoadingEmployees = true;
        const projectId = this.recordId || this.projectId;
        
        getProjectEmployees({ projectId: projectId })
            .then(result => {
                this.employeeOptions = [{ label: '--None--', value: '' }];
                result.forEach(emp => {
                    const roleLabel = emp.Role__c ? ` (${emp.Role__c})` : '';
                    this.employeeOptions.push({
                        label: `${emp.Name}${roleLabel}`,
                        value: emp.Id
                    });
                });
                this.isLoadingEmployees = false;
            })
            .catch(error => {
                console.error('Error fetching employees:', error);
                this.isLoadingEmployees = false;
            });
    }

    handleEmployeeChange(event) {
        this.selectedEmployeeId = event.detail.value;
    }

    fetchParentTasks() {
        this.isLoadingParentTasks = true;
        const projectId = this.recordId || this.projectId;
        
        getParentTasks({ projectId: projectId, currentRecordTypeId: this.recordTypeId })
            .then(result => {
                this.parentTaskOptions = [{ label: '--None--', value: '' }];
                result.forEach(task => {
                    this.parentTaskOptions.push({
                        label: `${task.Name} (${task.RecordType.Name})`,
                        value: task.Id
                    });
                });
                this.isLoadingParentTasks = false;
            })
            .catch(error => {
                console.error('Error fetching parent tasks:', error);
                this.isLoadingParentTasks = false;
            });
    }

    handleParentTaskChange(event) {
        this.selectedParentTaskId = event.detail.value;
    }

    handleBack() {
        this.showForm = false;
    }

    closeModal() {
        this.showModal = false;
    }
    handleSuccess() {
        this.closeModal();  
        this.dispatchEvent(new CustomEvent('taskcreated'));
    }
    handleCancel() {
        this.closeModal();
    }
    handleSubmit(event) {
        event.preventDefault(); // Prevent default submit
        const fields = event.detail.fields;
        fields.Project__c = this.recordId || this.projectId; // Ensure Project is set
        fields.Type__c = this.selectedTaskType; // Set the Type from selection
        // Set parent task if selected
        if (this.selectedParentTaskId) {
            fields.Sub_Task__c = this.selectedParentTaskId;
        }
        // Set assigned employee if selected
        if (this.selectedEmployeeId) {
            fields.Assigned_to__c = this.selectedEmployeeId;
        }
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }



}