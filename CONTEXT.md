# Nature Remo Control

This project models the observation and control of home appliances through Nature Remo. Terms distinguish what Nature Remo records from what an appliance has physically confirmed.

## Equipment

**Remo**:
A physical Nature Remo controller that observes its surroundings and communicates with appliances.
_Avoid_: Device, hub

**Appliance**:
A home appliance registered with Nature Remo.
_Avoid_: Device

**Aircon**:
An Appliance with air-conditioner capabilities such as temperature, operating mode, airflow, and power control.
_Avoid_: AC

**Infrared Appliance**:
An Appliance controlled through one-way infrared transmission.

**ECHONET Lite Appliance**:
An Appliance that exposes properties through ECHONET Lite and can report property values.

**Signal**:
A named infrared command learned for an Appliance.

**Control Button**:
A command defined by an Appliance model, such as power, volume up, or brightness down.
_Avoid_: Signal

## People and places

**Home**:
A named group of Remos and Members in Nature Remo.

**User**:
A person identified by a Nature account.
_Avoid_: Account

**Member**:
A User together with their role in a Home.

## Observation and control

**Sensor Reading**:
A timestamped environmental observation reported by a Remo, such as temperature or humidity.

**Recorded Settings**:
The latest Aircon configuration known by Nature Remo.
_Avoid_: Current settings, actual settings

**Recorded State**:
The latest Appliance state known by Nature Remo. For an Infrared Appliance, this state does not confirm the appliance's physical state.
_Avoid_: Current state, actual state

**Control Request**:
A requested change to an Appliance.

**Infrared Transmission**:
An infrared signal emitted toward an Infrared Appliance without an acknowledgement from that appliance.
_Avoid_: Confirmation

**Reported Property**:
A property value returned by an ECHONET Lite Appliance.

**Sensor Offset**:
A calibration value added to a Remo's measured temperature or humidity.
