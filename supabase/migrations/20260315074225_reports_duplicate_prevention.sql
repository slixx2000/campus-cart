create unique index if not exists reports_unique_listing_report
on public.reports(reporter_id, listing_id)
where report_type = 'listing' and listing_id is not null;

create unique index if not exists reports_unique_user_report
on public.reports(reporter_id, reported_user_id)
where report_type = 'user' and reported_user_id is not null;