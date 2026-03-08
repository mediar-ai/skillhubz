# Azure Compute Skill

Recommend Azure VM sizes, VM Scale Sets (VMSS), and configurations by analyzing workload type, performance requirements, scaling needs, and budget. No Azure subscription required -- all data comes from public Microsoft documentation and the unauthenticated Retail Prices API.

## When to Use This Skill

- User asks which Azure VM or VMSS to choose for a workload
- User needs VM size recommendations for web, database, ML, batch, HPC, or other workloads
- User wants to compare VM families, sizes, or pricing tiers
- User asks about trade-offs between VM options (cost vs performance)
- User needs a cost estimate for Azure VMs without an Azure account
- User asks whether to use a single VM or a scale set
- User needs autoscaling, high availability, or load-balanced VM recommendations
- User asks about VMSS orchestration modes (Flexible vs Uniform)

## Workflow

### Step 1: Gather Requirements

Ask the user for (infer when possible):

| Requirement            | Examples                                                           |
| ---------------------- | ------------------------------------------------------------------ |
| **Workload type**      | Web server, relational DB, ML training, batch processing, dev/test |
| **vCPU / RAM needs**   | "4 cores, 16 GB RAM" or "lightweight" / "heavy"                    |
| **GPU needed?**        | Yes -> GPU families; No -> general/compute/memory                  |
| **Storage needs**      | High IOPS, large temp disk, premium SSD                            |
| **Budget priority**    | Cost-sensitive, performance-first, balanced                        |
| **OS**                 | Linux or Windows (affects pricing)                                 |
| **Region**             | Affects availability and price                                     |
| **Instance count**     | Single instance, fixed count, or variable/dynamic                  |
| **Scaling needs**      | None, manual scaling, autoscale based on metrics or schedule       |
| **Availability needs** | Best-effort, fault-domain isolation, cross-zone HA                 |
| **Load balancing**     | Not needed, Azure Load Balancer (L4), Application Gateway (L7)     |

### Step 2: Determine VM vs VMSS

```text
Needs autoscaling?
-- Yes -> VMSS
-- No
   -- Multiple identical instances needed?
      -- Yes -> VMSS
      -- No
         -- High availability across fault domains / zones?
            -- Yes, many instances -> VMSS
            -- Yes, 1-2 instances -> VM + Availability Zone
         -- Single instance sufficient? -> VM
```

| Signal                                        | Recommendation                | Why                                                                   |
| --------------------------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| Autoscale on CPU, memory, or schedule         | **VMSS**                      | Built-in autoscale; no custom automation needed                       |
| Stateless web/API tier behind a load balancer | **VMSS**                      | Homogeneous fleet with automatic distribution                         |
| Batch / parallel processing across many nodes | **VMSS**                      | Scale out on demand, scale to zero when idle                          |
| Mixed VM sizes in one group                   | **VMSS (Flexible)**           | Flexible orchestration supports mixed SKUs                            |
| Single long-lived server (jumpbox, AD DC)     | **VM**                        | No scaling benefit; simpler management                                |
| Unique per-instance config required           | **VM**                        | Scale sets assume homogeneous configuration                           |
| Stateful workload, tightly-coupled cluster    | **VM** (or VMSS case-by-case) | Evaluate carefully; VMSS Flexible can work for some stateful patterns |

### Step 3: Select VM Family

Select 2-3 candidate VM families matching the workload. Verify specifications against current Azure documentation.

### Step 4: Look Up Pricing

Query the Azure Retail Prices API. VMSS has no extra charge -- pricing is per-VM instance.

### Step 5: Present Recommendations

Provide **2-3 options** with trade-offs:

| Column         | Purpose                                         |
| -------------- | ----------------------------------------------- |
| Hosting Model  | VM or VMSS (with orchestration mode if VMSS)    |
| VM Size        | ARM SKU name (e.g., `Standard_D4s_v5`)          |
| vCPUs / RAM    | Core specs                                      |
| Instance Count | 1 for VM; min-max range for VMSS with autoscale |
| Estimated $/hr | Per-instance pay-as-you-go from API             |
| Why            | Fit for the workload                            |
| Trade-off      | What the user gives up                          |

### Step 6: Offer Next Steps

- Compare reservation / savings plan pricing
- Suggest Azure Pricing Calculator for full estimates
- For VMSS: suggest reviewing autoscale best practices and VMSS networking

## Error Handling

| Scenario                        | Action                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------ |
| API returns empty results       | Broaden filters -- check armRegionName, serviceName, armSkuName spelling       |
| User unsure of workload type    | Ask clarifying questions; default to General Purpose D-series                  |
| Region not specified            | Use eastus as default; note prices vary by region                              |
| Unclear if VM or VMSS needed    | Ask about scaling and instance count; default to single VM if unsure           |
| User asks VMSS pricing directly | Use same VM pricing API -- VMSS has no extra charge; multiply by instance count |
