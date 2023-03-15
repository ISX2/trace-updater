# AUTO GENERATED FILE - DO NOT EDIT

#' @export
''TraceUpdater <- function(id=NULL, gdID=NULL, invisibleUpdateData=NULL, sequentialUpdate=NULL, updateData=NULL, verbose=NULL, visibleUpdate=NULL) {
    
    props <- list(id=id, gdID=gdID, invisibleUpdateData=invisibleUpdateData, sequentialUpdate=sequentialUpdate, updateData=updateData, verbose=verbose, visibleUpdate=visibleUpdate)
    if (length(props) > 0) {
        props <- props[!vapply(props, is.null, logical(1))]
    }
    component <- list(
        props = props,
        type = 'TraceUpdater',
        namespace = 'trace_updater',
        propNames = c('id', 'gdID', 'invisibleUpdateData', 'sequentialUpdate', 'updateData', 'verbose', 'visibleUpdate'),
        package = 'traceUpdater'
        )

    structure(component, class = c('dash_component', 'list'))
}
