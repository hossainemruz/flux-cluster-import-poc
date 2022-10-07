# flux-cluster-import-poc

POC for installing resources of cluster import flow using flux

#### Add Helm repository

```bash
helm repo add fluxcd-community https://fluxcd-community.github.io/helm-charts

helm repo update
```

#### Install Flux

```bash
helm install flux fluxcd-community/flux2 \
--namespace flux-system --create-namespace \
--set imageautomationcontroller.create=false \
--set imagereflectorcontroller.create=false \
--set kustomizecontroller.create=false \
--set notificationcontroller.create=false
```

#### Install `opscenter-core`

```bash
helm install opscenter-core opscenter-core -n kubeops --create-namespace
```

#### Install `opscenter-essential`

```bash
helm install opscenter-essential opscenter-essential -n kubeops --create-namespace
```

#### Install `opscenter-monitoring`

```bash
helm install opscenter-monitoring opscenter-monitoring -n kubeops --create-namespace
```
