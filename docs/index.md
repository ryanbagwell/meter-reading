# Energy monitory project

The goal of this project is to capture energy usage and generation data from my home, save it to a database and display that energy usage over time.

There are two data sources for this information: 1) my home's electric meter, which periodicially broadcasts data via radio frequencies, and 2) the SolarEdge REST API, which contains data from my Solar Energy Inverter.

Together, the data should be used to calculate and display 1) the amount of solar energy generated; 2) the amount of energy exported or imported to the grid, and 3) the amount of electricity ultimately used by the house.

## Architecture

The architecture should consist of the following:

### meter daemon

This daemon will run a process that will listen for radio signals from the electric meter and decode those signals into usable data.

- It should be written in python.
- It should leverage the pyrtlsdr python library.
- It should be able to decode data from multiple protocols.
- It should be based on the rtlamr project that is written in go


Decoded data should be saved to database through the REST API descibed elsewhere in this document.

### Solaredge Daemon

This daemon should query the solaredge api periodically and record the amount of power that has been generated for that period. The query interval should be configurable. API documentation is: https://knowledge-center.solaredge.com/sites/kc/files/se_monitoring_api.pdf

### Database

Data should be store in an sqlite database

### REST API

A REST api should provide public access to the data stored in the db. It should be written with Django and the Django Ninja library.

### Frontend

A nextjs/react app should display the data to the user in a chart. It should query the REST API for the data it needs to display to the user.

## Project layout

```
project ->
  
  rtlamr-python (the message decoder daemon)

  api (the REST api)

  ui (the frontend app)
```