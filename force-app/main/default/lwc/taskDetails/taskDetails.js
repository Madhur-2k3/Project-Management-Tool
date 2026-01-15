import { LightningElement,api } from 'lwc';

export default class TaskDetails extends LightningElement {
    @api taskId;


    fields=['Name','Description__c','Due_Date__c','Priority__c','Status__c','Assigned_to__c','Sub_Task__c'];
    closeModal() {
        this.showModal = false;
    }
    handleSuccess() {
        this.closeModal();  
        this.dispatchEvent(new CustomEvent('taskcreated'));
    }
    handleCancel() {
        // this.closeModal();
        this.dispatchEvent(new CustomEvent('taskcreated'));
    }
    handleSubmit(event) {
        event.preventDefault(); // Prevent default submit
        const fields = event.detail.fields;
        fields.Project__c = this.recordId || this.projectId; // Set the WhatId to the current recordId
        this.template.querySelector('lightning-record-form').submit(fields);
    }
}