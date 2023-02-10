# AUTO GENERATED FILE - DO NOT EDIT

#' @export
''TraceUpdater <- function(id=NULL, gdID=NULL, invisibleUpdateData=NULL, sequentialUpdate=NULL, visibleUpdate=NULL, visibleUpdateData=NULL) {
    
    props <- list(id=id, gdID=gdID, invisibleUpdateData=invisibleUpdateData, sequentialUpdate=sequentialUpdate, visibleUpdate=visibleUpdate, visibleUpdateData=visibleUpdateData)
    if (length(props) > 0) {
        props <- props[!vapply(props, is.null, logical(1))]
    }
    component <- list(
        props = props,
        type = 'TraceUpdater',
        namespace = 'trace_updater',
        propNames = c('id', 'gdID', 'invisibleUpdateData', 'sequentialUpdate', 'visibleUpdate', 'visibleUpdateData'),
        package = 'traceUpdater'
        )

    structure(component, class = c('dash_component', 'list'))
}
