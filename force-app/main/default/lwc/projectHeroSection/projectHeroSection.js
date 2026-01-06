import { LightningElement,api,track } from 'lwc';
import { refreshApex } from '@salesforce/apex';



export default class ProjectHeroSection extends LightningElement {
    // @api projectdata;
    selectedItemValue
    @api 
    set projectdata(value){
    this._projectdata = value;

    if(value){
        this.filteredProjects = [...value]; // clone
    }   
    }
    get projectdata(){
    return this._projectdata;
    }

    @track showModal = false;
    @track searchKey = '';
    @track filteredProjects=[];
    @track createTaskModal = false;
    @track showEditModal = false;
    @track selectedStatus = 'All';
    @track selectedMilestone = 'All';
    @track statusOptions = [
        { label: 'All', value: 'All' },
        { label: 'Planned', value: 'Planned' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' }
    ];
    @track milestoneOptions = [
        { label: 'All', value: 'All' },
        { label: 'Planning', value: 'Planning' },
        { label: 'Design', value: 'Design' },
        { label: 'Development', value: 'Development' },
        { label: 'Testing', value: 'Testing' },
        { label: 'Deployment', value: 'Deployment' }
    ];
    connectedCallback() {
        console.log('Project Data in Hero Section:', JSON.stringify(this.projectdata));
        this.filteredProjects = this.projectdata;
        
    }
    handleCreateProject(){
        this.showModal = true;
    }
    closeModal() {
        this.showModal = false;
        this.showEditModal = false;
        this.createTaskModal = false;
    }
    handleSuccess() {
        this.closeModal();  
    }
    handleCancel() {
        this.closeModal();
    }
    handleSubmit(event) {
        event.preventDefault(); // Prevent default submit
        const fields = event.detail.fields;
        this.template.querySelector('lightning-record-form').submit(fields);

    }
    handleSearchChange(event){
        const searchKey = event.target.value.toLowerCase();
        this.filteredProjects = this.projectdata.filter(project => 
            project.Project_Name__c.toLowerCase().includes(searchKey) || 
            (project.Description__c && project.Description__c.toLowerCase().includes(searchKey))
        );
    }
    handleOnselect(event){
        this.selectedItemValue = event.detail.value;
        console.log('Selected Value: ', this.selectedItemValue);
        if(this.selectedItemValue==='Edit') this.showEditModal = true;
        if(this.selectedItemValue==='Create Task') this.createTaskModal = true;
    }
    handleStatusChange(event){
        this.selectedStatus = event.detail.value;
        console.log('Selected Status: ', this.selectedStatus);
        if(this.selectedStatus === 'All'){
            this.filteredProjects = this.projectdata;
        } else {
            this.filteredProjects = this.projectdata.filter(project => project.Status__c === this.selectedStatus);
        }
    }
    handleMilestoneChange(event){
        this.selectedMilestone = event.detail.value;
        console.log('Selected Milestone: ', this.selectedMilestone);
        if(this.selectedMilestone === 'All'){
            this.filteredProjects = this.projectdata;
        } else {
            this.filteredProjects = this.projectdata.filter(project => project.Milestone__c === this.selectedMilestone);
        }
    }

}