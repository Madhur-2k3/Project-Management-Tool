public class ProjectTaskAgentAction {
    private static final String SOQL_PROMPT_TEMPLATE_NAME = 'SOQL_Generation';

    public class Response {
        @InvocableVariable(label='JSON Result')
        public String jsonResult;
    }

    @InvocableMethod(
        label='Search Records via AI Prompt'
        description='Generates and executes dynamic SOQL and returns JSON.'
    )
    public static List<Response> searchProjectsAndTasks(List<String> userRequest) {

        String userQuery = (userRequest != null && !userRequest.isEmpty())
            ? userRequest[0]
            : null;

        List<Response> responseList = new List<Response>();

        // Early return
        if (String.isBlank(userQuery)) {
            responseList.add(new Response());
            return responseList;
        }

        // INPUT 
        ConnectApi.WrappedValue userInputValue = new ConnectApi.WrappedValue();
        userInputValue.value = userQuery;

        Map<String, ConnectApi.WrappedValue> inputParams = new Map<String, ConnectApi.WrappedValue>();
        inputParams.put('Input:userInput', userInputValue);

        ConnectApi.EinsteinPromptTemplateGenerationsInput templateInput =
            new ConnectApi.EinsteinPromptTemplateGenerationsInput();
        templateInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
        templateInput.additionalConfig.applicationName = 'PromptBuilderPreview';
        templateInput.isPreview = false;
        templateInput.inputParams = inputParams;

        try {
            // Calling Prompt Template which generates Query
            ConnectApi.EinsteinPromptTemplateGenerationsRepresentation output =
                ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
                    SOQL_PROMPT_TEMPLATE_NAME,
                    templateInput
                );

            String generatedSOQL = output.generations[0].text;
            System.debug('Generated SOQL: ' + generatedSOQL);

            // QUERY 
            List<SObject> records = Database.query(generatedSOQL);

            //SERIALIZE
            Response res = new Response();
            res.jsonResult = JSON.serialize(records);

            responseList.add(res);
            return responseList;

        } catch (Exception e) {
            System.debug('Error: ' + e.getMessage());
            responseList.add(new Response());
            return responseList;
        }
    }
}