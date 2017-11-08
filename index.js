const msRestAzure = require('ms-rest-azure');
const { URL } = require('url');
const properties = require('/properties.json');
const propertyLister = require('/propertyLister');

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

const getPropertyId = async (credentials, propertyName) => {
    const propertyList = await propertyLister.listProperties(credentials);

    for (let i = 0; i < propertyList.length; i++) {
        const item = propertyList[i];
        if (item.properties.displayName === propertyName) {
            return item.name;
        }
    }

    return propertyName;
};

const createOrUpdate = async (credentials, property) => {
    const propertyId = await getPropertyId(credentials, property.name);

    const url = new URL(
        'https://management.azure.com/' +
        `subscriptions/${process.env.subscriptionId}/` +
        `resourceGroups/${process.env.resourceGroup}/` +
        'providers/Microsoft.ApiManagement/' +
        `service/${process.env.apiManagementServiceName}/` +
        `properties/${propertyId}` +
        '?api-version=2017-03-01');

    // see https://github.com/Azure/azure-sdk-for-node/tree/bf6473eae7faca1ca1cf1375ee53c6fc214ca1b1/runtime/ms-rest-azure#using-the-generic-authenticated-azureserviceclient-to-make-custom-requests-to-azure
    const azureServiceClient = new msRestAzure.AzureServiceClient(credentials);

    let options = {
        method: 'PUT',
        url: url.href,
        body:{
            properties: {
                displayName: property.name,
                value: property.value,
                tags: property.tags,
                secret: property.isSecret
            }
        }
    };

    const result = await azureServiceClient.sendRequest(options);

    if (result.error){
        throw new Error(JSON.stringify(result.error));
    }
    console.log('create/update api management property successful');
};

// utilizing batches to prevent the following error when updating large number of properties:
// "code":"GatewayTimeout","message":"The gateway did not receive a response from 'Microsoft.ApiManagement' within the specified time period."
const runOperationInBatches = async (items, batchSize, operation) => {
    let currentBatch = [];
    const batches = items.reduce((agg, item, index) => {
        if (index && (index % batchSize === 0)) {
            agg.push(currentBatch);
            currentBatch = [];
        }
        currentBatch.push(item);
        return agg;
    }, []);
    if (currentBatch) {
        batches.push(currentBatch);
    }
    for (const batch of batches) {
        await Promise.all(batch.map(item => operation(item)));
    }
};

login()
    .then(creds => {
        const props = Object.keys(properties);
        return runOperationInBatches(props, 10, (p) => {
            const currentProperty = Object.assign({ name: p }, properties[p]);
            return createOrUpdate(creds, currentProperty);
        });
    })
    .catch(error => {
        console.log(error);
        process.exit(1)
    });
