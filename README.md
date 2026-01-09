# SIA Device

Simple node-red library that manages connection to SIA server and helps with creation of packets to send to if from connected devices.
It just acts as a middle man that for now takes the SIA body and creates rest of the packet to send to the server and handles the ACK or lack of ACK from it.

For now just basic body is supported (not extended one with things like position and what not) and the user needs to create the body in correct SIA format that will get interpreted by the server.
However in future releases it's planned to have a much more streamline approach where user just sends code, name, id, zone area and what not and node will create the body by itself.

Server is configured in it's special node, on the input to SIA Device node user must input following parameters. Account setting will be provided by your SIA server administrator.

```
payload.account - hex string with account number
payload.accountPrefix - hex string with account prefix
payload.body - SIA payload body, e.g. Nri129^^pi4^FA
```


