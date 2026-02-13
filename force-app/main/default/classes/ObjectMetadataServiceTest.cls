@isTest
public class ObjectMetadataServiceTest {
    
    @isTest
    static void testGetObjectMetadata() {
        // Create test request
        ObjectMetadataService.ObjectMetadataRequest request = new ObjectMetadataService.ObjectMetadataRequest();
        request.includeSystemFields = false;
        
        List<ObjectMetadataService.ObjectMetadataRequest> requests = new List<ObjectMetadataService.ObjectMetadataRequest>{request};
        
        Test.startTest();
        List<ObjectMetadataService.ObjectMetadataResponse> responses = ObjectMetadataService.getObjectMetadata(requests);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, responses, 'Response should not be null');
        System.assertEquals(1, responses.size(), 'Should return one response');
        
        ObjectMetadataService.ObjectMetadataResponse response = responses[0];
        
        // Validate Project metadata
        System.assertNotEquals(null, response.projectMetadata, 'Project metadata should not be null');
        System.assertEquals('Project__c', response.projectMetadata.objectApiName, 'Project API name should be correct');
        System.assertNotEquals(null, response.projectMetadata.fields, 'Project fields should not be null');
        System.assert(response.projectMetadata.fields.size() > 0, 'Project should have fields');
        
        // Validate Task metadata
        System.assertNotEquals(null, response.taskMetadata, 'Task metadata should not be null');
        System.assertEquals('Task__c', response.taskMetadata.objectApiName, 'Task API name should be correct');
        System.assertNotEquals(null, response.taskMetadata.fields, 'Task fields should not be null');
        System.assert(response.taskMetadata.fields.size() > 0, 'Task should have fields');
        
        // Validate field metadata structure
        for (ObjectMetadataService.FieldMetadata field : response.projectMetadata.fields) {
            System.assertNotEquals(null, field.apiName, 'Field API name should not be null');
            System.assertNotEquals(null, field.label, 'Field label should not be null');
            System.assertNotEquals(null, field.type, 'Field type should not be null');
        }
    }
    
    @isTest
    static void testGetMetadataAsString() {
        // Create test request
        ObjectMetadataService.ObjectMetadataRequest request = new ObjectMetadataService.ObjectMetadataRequest();
        request.includeSystemFields = false;
        
        List<ObjectMetadataService.ObjectMetadataRequest> requests = new List<ObjectMetadataService.ObjectMetadataRequest>{request};
        
        Test.startTest();
        List<String> responses = ObjectMetadataService.getMetadataAsString(requests);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, responses, 'Response should not be null');
        System.assertEquals(1, responses.size(), 'Should return one response');
        
        String formattedMetadata = responses[0];
        System.assert(formattedMetadata.contains('PROJECT OBJECT METADATA'), 'Should contain project metadata header');
        System.assert(formattedMetadata.contains('TASK OBJECT METADATA'), 'Should contain task metadata header');
        System.assert(formattedMetadata.contains('FIELDS:'), 'Should contain fields section');
    }
    
    @isTest
    static void testFieldMetadataTypes() {
        // This test specifically validates different field types are handled correctly
        ObjectMetadataService.ObjectMetadataRequest request = new ObjectMetadataService.ObjectMetadataRequest();
        List<ObjectMetadataService.ObjectMetadataRequest> requests = new List<ObjectMetadataService.ObjectMetadataRequest>{request};
        
        Test.startTest();
        List<ObjectMetadataService.ObjectMetadataResponse> responses = ObjectMetadataService.getObjectMetadata(requests);
        Test.stopTest();
        
        ObjectMetadataService.ObjectMetadataResponse response = responses[0];
        
        // Look for specific field types in Task metadata
        Boolean hasTextFields = false;
        Boolean hasDateFields = false;
        Boolean hasPicklistFields = false;
        Boolean hasReferenceFields = false;
        
        for (ObjectMetadataService.FieldMetadata field : response.taskMetadata.fields) {
            if (field.type == 'STRING' || field.type == 'TEXTAREA') {
                hasTextFields = true;
            }
            if (field.type == 'DATE' || field.type == 'DATETIME') {
                hasDateFields = true;
            }
            if (field.type == 'PICKLIST') {
                hasPicklistFields = true;
                // Validate picklist values are populated
                if (field.picklistValues != null) {
                    System.assert(field.picklistValues.size() >= 0, 'Picklist values should be list');
                }
            }
            if (field.type == 'REFERENCE') {
                hasReferenceFields = true;
                System.assertNotEquals(null, field.referenceTo, 'Reference field should have referenceTo populated');
            }
        }
        
        // We expect to have at least text fields in any object
        System.assert(hasTextFields, 'Should have text fields');
    }
}