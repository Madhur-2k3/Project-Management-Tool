public with sharing class s3Controller {
    //get data from s3
    @AuraEnabled(cacheable=false)
    public static String getDataFromS3(String fileName) {
        try {
            HttpRequest request = new HttpRequest();
            request.setMethod('GET');
            String endpoint = 'callout:aws_s3';
            if (fileName != null && fileName.trim().length() > 0) {
                if (!endpoint.endsWith('/')) endpoint += '/';
                endpoint += EncodingUtil.urlEncode(fileName, 'UTF-8');
            }
            request.setEndpoint(endpoint);
            Http http = new Http();
            HttpResponse res = http.send(request);
            if (res.getStatusCode() == 200) {
                return res.getBody();
            } else {
                throw new AuraHandledException('Error fetching data from S3: ' + res.getStatusCode() + ' ' + res.getStatus());
            }
        } catch (Exception e) {
            throw new AuraHandledException('s3Controller.getDataFromS3 error: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=false)
    public static String listObjectsFromS3() {
        try {
            HttpRequest request = new HttpRequest();
            request.setMethod('GET');
            // Use S3 ListObjectsV2 via query param. Named credential should point to the bucket root.
            String endpoint = 'callout:aws_s3?list-type=2';
            request.setEndpoint(endpoint);
            Http http = new Http();
            HttpResponse res = http.send(request);
            if (res.getStatusCode() == 200) {
                String body = res.getBody();
                // S3 returns XML for ListObjectsV2. Parse and convert to JSON list of objects.
                Dom.Document doc = new Dom.Document();
                doc.load(body);
                Dom.XmlNode root = doc.getRootElement();
                List<Map<String, Object>> items = new List<Map<String, Object>>();
                for (Dom.XmlNode child : root.getChildElements()) {
                    if (child.getName() == 'Contents') {
                        Map<String, Object> mapItem = new Map<String, Object>();
                        for (Dom.XmlNode contentChild : child.getChildElements()) {
                            mapItem.put(contentChild.getName(), contentChild.getText());
                        }
                        items.add(mapItem);
                    }
                }
                return JSON.serialize(items);
            } else {
                throw new AuraHandledException('Error listing S3 objects: ' + res.getStatusCode() + ' ' + res.getStatus());
            }
        } catch (Exception e) {
            throw new AuraHandledException('s3Controller.listObjectsFromS3 error: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=false)
    public static String putObjectToS3(String fileName, String base64Body, String contentType) {
        try {
            HttpRequest request = new HttpRequest();
            request.setMethod('PUT');
            String endpoint = 'callout:aws_s3';
            if (fileName != null && fileName.trim().length() > 0) {
                if (!endpoint.endsWith('/')) endpoint += '/';
                endpoint += EncodingUtil.urlEncode(fileName, 'UTF-8');
            }
            request.setEndpoint(endpoint);
            if (contentType != null) {
                request.setHeader('Content-Type', contentType);
            }
            if (base64Body != null && base64Body.trim().length() > 0) {
                Blob bodyBlob = EncodingUtil.base64Decode(base64Body);
                request.setBodyAsBlob(bodyBlob);
            } else {
                request.setBody('');
            }
            Http http = new Http();
            HttpResponse res = http.send(request);
            if (res.getStatusCode() >= 200 && res.getStatusCode() < 300) {
                return res.getStatus() + ' (' + res.getStatusCode() + ')';
            } else {
                throw new AuraHandledException('Error uploading to S3: ' + res.getStatusCode() + ' ' + res.getStatus());
            }
        } catch (Exception e) {
            throw new AuraHandledException('s3Controller.putObjectToS3 error: ' + e.getMessage());
        }
    }
}