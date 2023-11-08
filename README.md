# MLB-API-2.0

Major League Baseball API that takes player WAR and draft information and stores into a local database.

# Endpoints
## /draft
Requests draft info based on query.
ex. "/draft?pid=123456&year=2022"

## /fielding
Requests fielding info based on query.
ex. "/fielding?pid=123456&year=2022"

## /pitching
Requests pitching info based on query.
ex. "/pitching?pid=123456&year=2022"

## /hitting
Requests hitting info based on query.
ex. "/hitting?pid=123456&year=2022"

## /info
Requests player info based on query.
ex. "/info?pid=123456&year=2022"

# Notes:
+ All endpoints will include support for multi-player query in the future (ex. "/draft?pid=1,2,3,4,5,6&year=2022" would get players with ID 1-6 from year 2022).
