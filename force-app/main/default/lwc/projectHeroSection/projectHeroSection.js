import { LightningElement, api, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';
import deleteProjectById from '@salesforce/apex/ProjectHandler.deleteProjectById';
import { getRecordNotifyChange } from 'lightning/uiRecordApi';

export default class ProjectHeroSection extends NavigationMixin(LightningElement) {
    
    // using setter to clone data and trigger filtering when parent passes new data
    @api 
    set projectdata(value){
        this._projectdata = value;
        if(value){
            this.filteredProjects = [...value];
        }   
    }
    get projectdata(){
        return this._projectdata;
    }
    @track showModal = false;
    @track createTaskModal = false;
    @track showEditModal = false;
    @track showDeleteModal = false;
    @track showProjectDetails = false;

    @track searchKey = '';
    @track filteredProjects = [];
    @track selectedStatus = 'All';
    @track selectedMilestone = 'All';

    @track selectedProjectId;
    @track selectedItemValue;
    @track projectName = '';
    
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
        // notify parent to refresh project list
        const refreshEvent = new CustomEvent('refreshprojects');
        this.dispatchEvent(refreshEvent);
    }
    
    handleCancel() {
        this.closeModal();     
    }
    
    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;
        this.template.querySelector('lightning-record-form').submit(fields);
    }
    
    // search input change handler
    handleSearchChange(event){
        const searchKey = event.target.value.toLowerCase();
        // filter by project name or description
        this.filteredProjects = this.projectdata.filter(project => 
            project.Project_Name__c.toLowerCase().includes(searchKey) || 
            (project.Description__c && project.Description__c.toLowerCase().includes(searchKey))
        );
    }
    
    // dropdown selection handler
    handleOnselect(event){
        this.selectedItemValue = event.detail.value;
        console.log('Selected Value: ', this.selectedItemValue);
        event.stopPropagation();
        if(this.selectedItemValue === 'Edit') this.showEditModal = true;
        if(this.selectedItemValue === 'Create Task') this.createTaskModal = true;
    }
    // menu click handler to capture selected project id
    handleMenuClick(event){
        event.stopPropagation(); // prevent card click from firing
        this.selectedProjectId = event.currentTarget.dataset.id;
        console.log('Project Clicked: ', this.selectedProjectId);
    }
    // status filter change handler
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
    
    // navigates to project details page
    handleProjectClick(event){
        this.selectedProjectId = event.currentTarget.dataset.id;
        console.log('Project Clicked: ', this.selectedProjectId);
        if(!this.selectedProjectId) return;
        
        // navigate to project details page with projectId in state
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'Project_Details_Page' 
            },
            state: {
                c__projectId: this.selectedProjectId,
            }
        });
    }
    
    // Opens the delete confirmation modal
    handleDeleteClick(event){
        this.selectedProjectId = event.currentTarget.dataset.id;
        this.projectName = this.filteredProjects.find(project => project.Id === this.selectedProjectId).Project_Name__c;
        console.log("selectedId", this.selectedProjectId);
        event.stopPropagation();
        if(this.selectedProjectId){
            this.showDeleteModal = true;
        }
    }
    
    // Deletes the selected project
    async handleDelete(){
        console.log("selectedId", this.selectedProjectId);
        try {
            await deleteProjectById({ projectId: this.selectedProjectId });
            // notify LDS cache and parent component
            getRecordNotifyChange([{ recordId: this.selectedProjectId }]);
            const refreshEvent = new CustomEvent('refreshprojects');
            this.dispatchEvent(refreshEvent);
            this.showDeleteModal = false;
        } catch(error) {
            console.error("Error deleting project: ", error);
        }
    }
    
    handleCancelDelete(){
        this.showDeleteModal = false;
    }
}