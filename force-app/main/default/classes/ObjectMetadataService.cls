public class ObjectMetadataService {
    
    @InvocableMethod(
        label='Get Field Metadata for Prompt'
        description='Generates a prompt containing API Name, Label, and Data Type for all fields of Task__c and Project__c'
    )
    public static List<Response> fetchFieldDetails(List<Request> requests) {
        
        List<Response> responses = new List<Response>();
        
        List<String> objectAPINames = new List<String>{
            'Project__c',
            'Task__c'
        };
        
        Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
        
        for (Request req : requests) {
            
            String prompt = '';
            
            try {
                for (String objectAPIName : objectAPINames) {
                    
                    if (!schemaMap.containsKey(objectAPIName)) {
                        prompt +=
                            'ERROR: Object API Name "' + objectAPIName + '" was not found in this org.\n\n';
                        continue;
                    }
                    
                    Schema.DescribeSObjectResult objectDescribe =
                        schemaMap.get(objectAPIName).getDescribe();
                    
                    Map<String, Schema.SObjectField> fieldMap =
                        objectDescribe.fields.getMap();
                    
                    // Object header
                    prompt += 'Object: ' + objectAPIName + '\n';
                    
                    for (Schema.SObjectField fieldToken : fieldMap.values()) {
                        Schema.DescribeFieldResult fieldDescribe =
                            fieldToken.getDescribe();
                        
                        String fieldInfo =
                            '- API Name: ' + fieldDescribe.getName() +
                            ', Label: ' + fieldDescribe.getLabel() +
                            ', Type: ' + fieldDescribe.getType().name();
                        
                        // Add picklist values if applicable
                        if (fieldDescribe.getType() == Schema.DisplayType.PICKLIST ||
                            fieldDescribe.getType() == Schema.DisplayType.MULTIPICKLIST) {
                            
                            List<Schema.PicklistEntry> picklistEntries =
                                fieldDescribe.getPicklistValues();
                            
                            List<String> picklistValues = new List<String>();
                            for (Schema.PicklistEntry entry : picklistEntries) {
                                if (entry.isActive()) {
                                    picklistValues.add(entry.getLabel());
                                }
                            }
                            
                            if (!picklistValues.isEmpty()) {
                                fieldInfo +=
                                    ', Picklist Values: [' +
                                    String.join(picklistValues, ', ') +
                                    ']';
                            }
                        }
                        
                        prompt += fieldInfo + '\n';
                    }
                    
                    prompt += '\n'; // spacing between objects
                }
                
                Response res = new Response();
                res.Prompt = prompt;
                responses.add(res);
                
            } catch (Exception e) {
                Response errorRes = new Response();
                errorRes.Prompt =
                    'ERROR: Unable to fetch field metadata. Details: ' + e.getMessage();
                responses.add(errorRes);
            }
        }
        
        return responses;
    }
    
    //Request Wrapper
    public class Request {
        @InvocableVariable(required=false)
        public String contextNote; 
    }
    
    //Response Wrapper
    public class Response {
        @InvocableVariable
        public String Prompt;
    }

}
