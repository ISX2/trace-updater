# AUTO GENERATED FILE - DO NOT EDIT

export traceupdater

"""
    traceupdater(;kwargs...)

A TraceUpdater component.
TraceUpdater is a component which updates the trace-data of a plotly graph.
It takes the properties
 - gdID - which is the DCC.graph its id
 - sequentialUpdate - if true, each trace is updated sequentially;
     i.e. Plotly.restyle is called sequentially
 - updatedData - A list whose:
    * first object withholds the to-be applied layout
    * second to ... object contain the updated trace data and its corresponding
      index under the `index` attribute
Keyword arguments:
- `id` (String; optional): The ID used to identify this component in Dash callbacks.
- `gdID` (String; required): The id of the graph-div whose traces should be
- `sequentialUpdate` (Bool; optional): Bool indicating whether the figure should be redrawn sequentially (i.e.)
calling the restyle multiple times or at once.
(still needs to be determined which is faster has the lowest memory peak)
- `updateData` (Array; optional): The data to update the graph with, must contain the `index` property for
each trace; either a list of dict-traces or a single trace
"""
function traceupdater(; kwargs...)
        available_props = Symbol[:id, :gdID, :sequentialUpdate, :updateData]
        wild_props = Symbol[]
        return Component("traceupdater", "TraceUpdater", "trace_updater", available_props, wild_props; kwargs...)
end

