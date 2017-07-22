# Problem statement
sets an azure api management property

# Example usage

> note: in examples, VERSION represents a version of the azure.apimanagement.property.set pkg

## install

```shell
opctl pkg install github.com/opspec-pkgs/azure.apimanagement.property.set#VERSION
```

## run

```
opctl run github.com/opspec-pkgs/azure.apimanagement.property.set#VERSION
```

## compose

```yaml
op:
  pkg: { ref: github.com/opspec-pkgs/azure.apimanagement.property.set#VERSION }
  inputs:
    subscriptionId:
    loginId:
    loginSecret:
    loginTenantId:
    resourceGroup:
    apiManagementServiceName:
    propertyName:
    propertyValue:
    # begin optional args
    propertyTags:
    isPropertySecret:
    loginType:
    # end optional args
```
# Support

join us on [![Slack](https://opspec-slackin.herokuapp.com/badge.svg)](https://opspec-slackin.herokuapp.com/)
or [open an issue](https://github.com/opspec-pkgs/azure.apimanagement.property.set/issues)
