const msRestAzure = require('ms-rest-azure');
const { URL } = require('url');
class PropertyLister {
    constructor(){
        this.list = null;
    }
    /**
     * Lists existing properties.
     * note: results will be retrieved only once; subsequent calls will return cached results
     * @param credentials
     * @return {Promise<*>}
     */
    async listProperties(credentials) {
        if (!this.list) {
            const url = new URL(
                'https://management.azure.com/' +
                `subscriptions/${process.env.subscriptionId}/` +
                `resourceGroups/${process.env.resourceGroup}/` +
                'providers/Microsoft.ApiManagement/' +
                `service/${process.env.apiManagementServiceName}/` +
                `properties` +
                '?api-version=2017-03-01');

            // see https://github.com/Azure/azure-sdk-for-node/tree/bf6473eae7faca1ca1cf1375ee53c6fc214ca1b1/runtime/ms-rest-azure#using-the-generic-authenticated-azureserviceclient-to-make-custom-requests-to-azure
            const azureServiceClient = new msRestAzure.AzureServiceClient(credentials);

            let options = {
                method: 'GET',
                url: url.href
            };

            console.log('listing api management properties');
            this.list = azureServiceClient.sendRequest(options)
            .then(result => {
                if (result.error) {
                    throw new Error(JSON.stringify(propertyList.error));
                }

                console.log('api management properties listed');
                return result.value;
            });
        }
        return this.list;
    }
}

module.exports = new PropertyLister();
