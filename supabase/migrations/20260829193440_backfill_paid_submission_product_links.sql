update public.listing_submissions as submission
set product_id = product.id
from public.products as product
where submission.product_id is null
  and submission.status = 'submitted'
  and product.listing_source = 'paid'
  and product.normalized_domain = submission.normalized_domain;
