const msRestAzure = require('ms-rest-azure');
const { URL } = require('url');
let createOrUpdateAttempts = 0;

const login = async () => {
    console.log('logging in');

    const loginType = process.env.loginType;
    const loginId = process.env.loginId;
    const loginSecret = process.env.loginSecret;

    let response;
    if (loginType === 'sp') {
        // https://github.com/Azure/azure-sdk-for-node/blob/66a255dd882762e93e5b9b92ba63ebb222962d59/runtime/ms-rest-azure/lib/login.js#L414
        response = await msRestAzure.loginWithServicePrincipalSecret(loginId, loginSecret, process.env.loginTenantId);
    } else {
        // https://github.com/Azure/azure-sdk-for-node/blob/66a255dd882762e93e5b9b92ba63ebb222962d59/runtime/ms-rest-azure/index.d.ts#L376
        response = await msRestAzure.loginWithUsernamePassword(loginId, loginSecret, {domain: process.env.loginTenantId});
    }

    console.log('login successful');

    return response;
};

const registerProvider = async (credentials) => {
    console.log('registering resource provider Microsoft.ApiManagement');

    const url = new URL(
        'https://management.azure.com/' +
        `subscriptions/${process.env.subscriptionId}/` +
        'providers/Microsoft.ApiManagement/register' +
        '?api-version=2017-03-01');

    // see https://github.com/Azure/azure-sdk-for-node/tree/bf6473eae7faca1ca1cf1375ee53c6fc214ca1b1/runtime/ms-rest-azure#using-the-generic-authenticated-azureserviceclient-to-make-custom-requests-to-azure
    const azureServiceClient = new msRestAzure.AzureServiceClient(credentials);

    let options = {
        method: 'POST',
        url: url.href
    };

    const result = await azureServiceClient.sendRequest(options);

    if (result.error){
        throw new Error(JSON.stringify(result.error));
    }

    console.log('registering resource provider Microsoft.ApiManagement successful');
};

const createOrUpdate = async (credentials) => {
    createOrUpdateAttempts++;

    console.log('create/update api management property');

    const url = new URL(
        'https://management.azure.com/' +
        `subscriptions/${process.env.subscriptionId}/` +
        `resourceGroups/${process.env.resourceGroup}/` +
        'providers/Microsoft.ApiManagement/' +
        `service/${process.env.apiManagementServiceName}/` +
        `properties/${process.env.propertyName}` +
        '?api-version=2017-03-01');

    // see https://github.com/Azure/azure-sdk-for-node/tree/bf6473eae7faca1ca1cf1375ee53c6fc214ca1b1/runtime/ms-rest-azure#using-the-generic-authenticated-azureserviceclient-to-make-custom-requests-to-azure
    const azureServiceClient = new msRestAzure.AzureServiceClient(credentials);

    let tagsArray = process.env.propertyTags.split(',');

    let options = {
        method: 'PUT',
        url: url.href,
        body:{
            properties: {
                displayName: process.env.propertyName,
                value: process.env.propertyValue,
                tags: tagsArray,
                secret: process.env.isPropertySecret
            }
        }
    };

    const result = await azureServiceClient.sendRequest(options);

    if (result.error){
        if (result.error.code === 'MissingSubscriptionRegistration' && createOrUpdateAttempts === 1) {
            // provider not registered; register & retry create, but only once
            console.log("Microsoft.ApiManagement provider not registered for subscription");
            await registerProvider(credentials);
            await createOrUpdate(credentials);
            return;
        }
        throw new Error(JSON.stringify(result.error));
    }
    console.log('create/update api management property successful');
};

login().then(createOrUpdate).catch(error => {
    console.log(error);
    process.exit(1)
});