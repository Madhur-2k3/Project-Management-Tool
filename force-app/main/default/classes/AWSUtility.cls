public class AWSUtility {
	public String AWSKey;
	public String AWSSecret;
	public String bucketName;
	public String methodName;
	public String hostName;

	public AWSUtility(String key, String secret, String bucket, String method, String host) {
		this.AWSKey = key;
		this.AWSSecret = secret;
		this.bucketName = bucket;
		this.methodName = method;
		this.hostName = host;
	}

	public String createAuthHeader(String contentType, String fileName, String formattedDateString, String fileExtension) {
		String stringToSign = this.methodName + '\n' +
			contentType + '\n' +
			formattedDateString + '\n' +
			'/' + this.bucketName + '/' + fileName.toLowerCase() + '.' + fileExtension.toLowerCase();

		Blob mac = Crypto.generateMac('HmacSHA1', Blob.valueOf(stringToSign), Blob.valueOf(this.AWSSecret));
		String authHeader = 'AWS ' + this.AWSKey + ':' + EncodingUtil.base64Encode(mac);
		return authHeader;
	}

	public String getContentType(String fileType) {
		switch on fileType.toLowerCase() {
			when 'csv' {
				return 'application/vnd.ms-excel';
			}
			when 'docx', 'doc' {
				return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
			}
			when 'wav' {
				return 'audio/wav';
			}
			when 'png' {
				return 'image/png';
			}
			when 'pdf' {
				return 'application/pdf';
			}
			when else {
				return 'image/jpeg';
			}
		}
	}

	public void uploadDocuments(String recordId) {
		List<ContentDocumentLink> contentLinkList = [
			SELECT ContentDocumentId, LinkedEntityId
			FROM ContentDocumentLink
			WHERE LinkedEntityId = :recordId
		];

		Set<Id> contentDocIdSet = new Set<Id>();
		for (ContentDocumentLink link : contentLinkList) {
			contentDocIdSet.add(link.ContentDocumentId);
		}

		List<ContentVersion> docVersions = [
			SELECT VersionData, Title, ContentDocumentId, FileExtension
			FROM ContentVersion
			WHERE ContentDocumentId IN :contentDocIdSet AND IsLatest = true
		];

		for (ContentVersion attachment : docVersions) {
			Blob attachmentBody = attachment.VersionData;
			String formattedDateString = DateTime.now().formatGMT('EEE, dd MMM yyyy HH:mm:ss z');
			String fileName = attachment.Title;
			String fileExtension = attachment.FileExtension;
			String contentType = getContentType(fileExtension);

			String fileURL = 'https://' + this.bucketName + '.' + this.hostName + '/' + fileName.toLowerCase() + '.' + fileExtension.toLowerCase();

			HttpRequest req = new HttpRequest();
			req.setMethod(this.methodName);
			req.setEndpoint(fileURL);

			req.setHeader('Host', this.bucketName + '.' + this.hostName);
			req.setHeader('Content-Length', String.valueOf(attachmentBody.size()));
			req.setHeader('Content-Encoding', 'UTF-8');
			req.setHeader('Content-Type', contentType);
			req.setHeader('Connection', 'Keep-Alive');
			req.setHeader('Date', formattedDateString);
			req.setHeader('x-amz-acl', 'public-read');

			req.setBodyAsBlob(attachmentBody);

			req.setHeader('Authorization', createAuthHeader(contentType, fileName, formattedDateString, fileExtension));

			Http http = new Http();
			HttpResponse res = http.send(req);

			System.debug('Response Status Code: ' + res.getStatusCode());
		}
	}
}