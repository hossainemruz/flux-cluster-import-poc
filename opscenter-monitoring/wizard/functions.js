export function returnFalse() {
    return false
  }
  
  export function returnTrue() {
    return true
  }
  
  export function showConfigurationFieldsFor(
    { discriminator, getValue, watchDependency },
    type
  ) {
    const configureType = getValue(discriminator, '/configureType')
    watchDependency('discriminator#/configureType')
    return configureType === type
  }
  
  export function setConfigureType({ model, getValue }) {
    const { service } = getValue(model, '/')
    if (service) return 'service'
    else return 'url'
  }
  
  export function onConfigureTypeChange({ discriminator, getValue, commit }) {
    const configureType = getValue(discriminator, '/configureType')
    if (configureType === 'url') {
      commit('wizard/model$delete', '/service')
    } else if (configureType === 'service') {
      commit('wizard/model$delete', '/url')
    }
  }
  
  export function getServicePorts({
    discriminator,
    model,
    getValue,
    watchDependency,
    commit,
  }) {
    watchDependency('model#/service/name')
    watchDependency('discriminator#/services')
  
    const serviceName = getValue(model, '/service/name')
    const services = getValue(discriminator, '/services')
  
    if (services && serviceName) {
      const service = services.find(
        (item) => item.spec && item.metadata.name === serviceName
      )
      const ports = (service && service.spec && service.spec.ports) || []
  
      const portList = ports.map((item) => item.port)
  
      if (portList.length) {
        commit('wizard/model$update', {
          path: '/service/port',
          value: portList[0],
          force: true,
        })
      }
  
      return portList
    } else {
      return []
    }
  }
  
  export function onNamespaceChange({ commit, getValue, model }) {
    const namespace = getValue(model, '/service/namespace')
    if (namespace) {
      commit('wizard/model$delete', '/service/name')
      commit('wizard/model$delete', '/service/port')
    }
  }
  
  export function setScheme({ model, getValue }) {
    const scheme = getValue(model, '/service/scheme')
    return scheme || 'http'
  }
  
  // eslint-disable-next-line no-empty-pattern
  export function encodeBase64({}, value) {
    return btoa(value)
  }
  
  // eslint-disable-next-line no-empty-pattern
  export function decodeBase64({}, value) {
    return atob(value)
  }
  
  export function showtlsClientAuthAndCaCert({
    model,
    discriminator,
    getValue,
    watchDependency,
    commit,
  }) {
    watchDependency('model#/service/scheme')
    watchDependency('discriminator#/configureType')
  
    const configureType = getValue(discriminator, '/configureType')
    const scheme = getValue(model, '/service/scheme')
  
    if (scheme === 'http') {
      commit('wizard/model$delete', '/caCert')
      commit('wizard/model$delete', '/clientCert')
      commit('wizard/model$delete', '/clientKey')
    }
  
    return scheme === 'https' || configureType === 'url'
  }
  
  export function onCaCertDisable({ commit }) {
    commit('wizard/model$delete', '/caCert')
  }
  
  export function onTlsClientDisable({ commit }) {
    commit('wizard/model$delete', '/clientKey')
    commit('wizard/model$delete', '/clientCert')
  }
  
  export function onPrometheusChange({ model, discriminator, getValue, commit }) {
    const prometheuses = getValue(discriminator, '/prometheuses')
    const selectedPrometheusName = getValue(model, '/service/prometheus')
  
    if (prometheuses?.length && selectedPrometheusName) {
      const selectedPrometheus = prometheuses.find(
        (item) => item.value === selectedPrometheusName
      )
  
      if (selectedPrometheus) {
        const serviceMonitorSelector =
          selectedPrometheus.spec?.serviceMonitorSelector?.matchLabels || {}
        const ruleSelector =
          selectedPrometheus.spec?.ruleSelector?.matchLabels || {}
  
        const serviceMonitorSelectorInModel = getValue(
          model,
          '/serviceMonitorSelector'
        )
        const ruleSelectorInModel = getValue(model, '/ruleSelector')
  
        if (
          Object.keys(serviceMonitorSelector).length &&
          (!serviceMonitorSelectorInModel ||
            Object.keys(serviceMonitorSelectorInModel).length)
        ) {
          commit('wizard/model$update', {
            path: '/serviceMonitorSelector',
            value: serviceMonitorSelector,
            force: true,
          })
        }
  
        if (
          Object.keys(ruleSelector).length &&
          (!ruleSelectorInModel || Object.keys(ruleSelectorInModel).length)
        ) {
          commit('wizard/model$update', {
            path: '/ruleSelector',
            value: ruleSelector,
            force: true,
          })
        }
      }
    }
  }
  
  export async function getResources(
    { axios },
    owner,
    cluster,
    group,
    version,
    resource,
    params
  ) {
    const resp = await axios.get(
      `/clusters/${owner}/${cluster}/proxy/${group}/${version}/${resource}`,
      {
        params: params || { filter: { items: { metadata: { name: null } } } },
      }
    )
  
    const resources = (resp && resp.data && resp.data.items) || []
  
    resources.map((item) => {
      const name = (item.metadata && item.metadata.name) || ''
      item.text = name
      item.value = name
      return true
    })
    return resources
  }
  
  export async function getNamespacedResources(
    { axios },
    owner,
    cluster,
    group,
    version,
    namespace,
    resource,
    params
  ) {
    const url = `/clusters/${owner}/${cluster}/proxy/${group}/${version}/namespaces/${namespace}/${resource}`
  
    let ans = []
    try {
      const resp = await axios.get(url, {
        params: params || {
          filter: { items: { metadata: { name: null }, type: null } },
        },
      })
  
      const items = (resp && resp.data && resp.data.items) || []
      ans = items
    } catch (e) {
      console.log(e)
    }
    return ans
  }
  
  export async function getNamespaces({ axios, route, getValue }) {
    const owner = getValue(route, '/params/user')
    const cluster = getValue(route, '/params/cluster')
  
    const params = {
      filter: {
        items: { metadata: { name: null } },
      },
    }
  
    const resources = await getResources(
      { axios },
      owner,
      cluster,
      'core',
      'v1',
      'namespaces',
      params
    )
  
    const mappedResources = resources.map((item) => {
      const name = item?.metadata?.name || ''
      return {
        text: name,
        value: name,
      }
    })
  
    return mappedResources
  }
  
  export async function getServices(
    {
      axios,
      route,
      model,
      discriminator,
      getValue,
      watchDependency,
      setDiscriminatorValue,
      commit,
    },
    path
  ) {
    watchDependency('model#/service/namespace')
    const namespace = getValue(model, '/service/namespace')
    const owner = getValue(route, '/params/user')
    const cluster = getValue(route, '/params/cluster')
  
    const params = {
      filter: {
        items: { metadata: { name: null }, spec: { ports: null } },
      },
    }
  
    const services = await getNamespacedResources(
      { axios },
      owner,
      cluster,
      'core',
      'v1',
      namespace,
      'services',
      params
    )
  
    const filteredServices = services
      .filter(
        (item) =>
          item?.spec?.ports?.length && item.metadata?.name?.endsWith('prometheus')
      )
      .map((item) => {
        const name = item.metadata?.name || ''
        return {
          ...item,
          text: name,
          value: name,
        }
      })
  
    const configureType = getValue(discriminator, '/configureType')
    if (filteredServices?.length && path && configureType === 'service') {
      commit('wizard/model$update', {
        path,
        value: filteredServices[0].value,
        force: true,
      })
    }
  
    setDiscriminatorValue('/services', filteredServices)
  
    return filteredServices
  }
  
  export async function getPrometheuses(
    {
      axios,
      route,
      getValue,
      watchDependency,
      model,
      discriminator,
      commit,
      setDiscriminatorValue,
    },
    path
  ) {
    watchDependency('model#/service/namespace')
    const namespace = getValue(model, '/service/namespace')
    const owner = getValue(route, '/params/user')
    const cluster = getValue(route, '/params/cluster')
  
    const params = {
      filter: {
        items: {
          metadata: { name: null },
          spec: {
            serviceMonitorSelector: { matchLabels: null },
            ruleSelector: { matchLabels: null },
          },
          type: null,
        },
      },
    }
  
    const resources = await getNamespacedResources(
      { axios },
      owner,
      cluster,
      'monitoring.coreos.com',
      'v1',
      namespace,
      'prometheuses',
      params,
      true
    )
  
    const filteredResources = resources.map((item) => {
      const name = item?.metadata?.name || ''
      return {
        ...item,
        text: name,
        value: name,
      }
    })
  
    const configureType = getValue(discriminator, '/configureType')
  
    if (filteredResources?.length && path && configureType === 'service') {
      commit('wizard/model$update', {
        path,
        value: filteredResources[0].value,
        force: true,
      })
    }
  
    setDiscriminatorValue('/prometheuses', filteredResources)
  
    return filteredResources
  }