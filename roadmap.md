﻿# Roadmap

# TODOs

- [ ] Being able to group files for a job instead of applying the prompt separately for each file
- [ ] Decide what to do with completed jobs in the long term
- [ ] Explore deploying the bucket in ca and the lambdas/bedrock calls in us
- [ ] Add metrics + reports on the total tokens in/ou + alerts
- [ ] Add metrics to monitor average length of files and the average maount of bedrock calls per files or corpus
- [ ] Add staging environment + distribution for features development
- [ ] Optimize pipeline to reduce cdn invalidations (right now it is one invalidation for every code push)
- [ ] Friendly names for result files
- [ ] Add tests