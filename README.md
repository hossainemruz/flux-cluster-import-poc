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
