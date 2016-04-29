# NBtoGTFSrt

A not-yet functional nodejs based NextBus API to GTFSrt converter.

###Background
NextBus is one of the largest providers of real-time passenger information in North America. It provides a limited API, focused around querying data for individual stops.
This API is further limited by a limit on the number of bytes that can be consumed per IP. This limit applies to data requested for any and all transit agencies hosted on nextbus.com.

###Theory of operation

This tool aims to leverage the design of the NextBus system to reconstruct the system's predictions using prior knowledge while limiting the number of requests from the NextBus API..

NextBus' [patented prediction algorithm] (http://patft.uspto.gov/netacgi/nph-Parser?Sect2=PTO1&Sect2=HITOFF&p=1&u=%2Fnetahtml%25%2FPTO%25%2Fsearch-bool.html&r=1&f=G&l=50&d=PALL&RefSrch=yes&Query=PN%2F6,374,176) works according to the following 

> (a) storing an historical transit data table containing transit vehicle schedules of the travel times necessary for said transit vehicles to move from one stop to another along their routes under different conditions, advertisements, and information for the operators and passengers of said transit vehicles,
> 
> (b) selecting from said historical transit data table a schedule of travel times applicable for current conditions along a given route, and
> 
> (c) using said schedule of travel times from said historical transit data table and said position of said transit vehicles at a given time to calculate predicted arrival times at which said transit vehicles will arrive at upcoming stops and incorporating, said predicted arrival times in a predicted transit data table ;  


- Define a Stop object as both the stop_id and the time difference from the previous stop. (done)
- Build a cache of extended trip patterns, with the key along the lines of agency-route-direction-[stops]. (done)
- If empty, prime the cache by prioritizing querying for predictions on a route.  (done)
-  Update and prune this cache via some strategy (TBD). 
- For every query period, query for 1/n stops, and use the pattern cache to fill in predictions for the remaining (n-1)/n stops. (TBD)
- Take the predictions generated above and generate a GTFSrt feed (TBD)

###Dependencies

* nodejs
* redis configured in the default fashion

