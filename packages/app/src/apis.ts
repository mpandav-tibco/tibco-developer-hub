import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import { GithubAuth } from '@backstage/core-app-api';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
  createApiRef,
  discoveryApiRef,
  oauthRequestApiRef,
  OpenIdConnectApi,
  ProfileInfoApi,
  BackstageIdentityApi,
  SessionApi,
  ApiRef,
  githubAuthApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import {
  apiDocsModuleWsdlApiRef,
  ApiDocsModuleWsdlClient,
  wsdlApiWidget,
} from '@dweber019/backstage-plugin-api-docs-module-wsdl';
import { OAuth2 } from '@backstage/core-app-api';
import { apiDocsConfigRef, defaultDefinitionWidgets } from '@backstage/plugin-api-docs';
import { ApiEntity } from '@backstage/catalog-model/index';

export const tibcoOIDCAuthApiRef: ApiRef<
  OpenIdConnectApi & ProfileInfoApi & BackstageIdentityApi & SessionApi
> = createApiRef({
  id: 'auth.tibco',
});

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: apiDocsModuleWsdlApiRef,
    deps: {
      identityApi: identityApiRef,
      discoveryApi: discoveryApiRef,
    },
    factory: ({ identityApi, discoveryApi }) =>
      new ApiDocsModuleWsdlClient({ identityApi, discoveryApi }),
  }),
  createApiFactory({
    api: apiDocsConfigRef,
    deps: {},
    factory: () => {
      const definitionWidgets = defaultDefinitionWidgets();
      return {
        getApiDefinitionWidget: (apiEntity: ApiEntity) => {
          if (apiEntity.spec.type.toLowerCase() === 'wsdl') {
            return wsdlApiWidget(apiEntity);
          }
          return definitionWidgets.find(d => d.type === apiEntity.spec.type);
        },
      };
    },
  }),
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  createApiFactory({
    api: tibcoOIDCAuthApiRef,
    deps: {
      discoveryApi: discoveryApiRef,
      oauthRequestApi: oauthRequestApiRef,
      configApi: configApiRef,
    },
    factory: ({ discoveryApi, oauthRequestApi, configApi }) =>
      OAuth2.create({
        discoveryApi,
        oauthRequestApi,
        provider: {
          id: 'tibco',
          title: 'TIBCO authentication provider',
          icon: () => null,
        },
        environment: configApi.getOptionalString('auth.environment'),
        defaultScopes: ['openid', 'profile', 'email'],
      }),
  }),
  createApiFactory({
    api: githubAuthApiRef,
    deps: {
      discoveryApi: discoveryApiRef,
      oauthRequestApi: oauthRequestApiRef,
    },
    factory: ({ discoveryApi, oauthRequestApi }) =>
      GithubAuth.create({
        discoveryApi,
        oauthRequestApi,
        defaultScopes: ['read:user', 'read:org'],
      }),
  }),
  ScmAuth.createDefaultApiFactory(),
];
