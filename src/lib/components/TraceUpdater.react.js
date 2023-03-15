import {Component} from 'react';
import PropTypes from 'prop-types';
import {
    head,
    tail,
    isPlainObject,
    isArray,
    isNil,
    flatMap,
    keys,
    toPairs,
    fromPairs,
    mapValues,
    zipObject,
    isElement,
    uniq,
} from 'lodash';


// HELPER FUNCTIONS //
const plotlyRestyle = (graphDiv, {index, ...update}) =>
    Plotly.restyle(graphDiv, update, index);

const isValidTrace = (trace) =>
    isPlainObject(trace) && !isNil(trace.index);

const filterTrace = (trace) => fromPairs(
    toPairs(trace)
        .filter(([_, value]) => !isNil(value))
        .filter(([key, _]) => !['x', 'y'].includes(key) || trace.x !== []),
);

const filterTraces = (traces) =>
    traces
        .filter(isValidTrace)
        .map(filterTrace);

const formatValue = (value) =>
    isArray(value) ? [value] : value;

const formatTrace = (trace) =>
    mapValues(trace, formatValue);

const formatTraces = (traces) =>
    traces.map(formatTrace);

const mergeKeys = (traces) =>
    uniq(flatMap(traces, keys));

const mergeValues = (traces, allkeys) =>
    allkeys.map(
        key => traces.map(
            trace => trace[key] ?? [],
        ),
    );

const mergeTraces = (traces) => {
    const allkeys = mergeKeys(traces);
    const allvalues = mergeValues(traces, allkeys);
    return zipObject(allkeys, allvalues);
};


/**
 * TraceUpdater is a component which updates the trace-data of a plotly graph.
 */
export default class TraceUpdater extends Component {

    static #previousLayout = null;
    static #latestUpdate = null;
    static #valid = false;

    constructor(props) {
        super(props);
        this.visibleUpdate = 0;
    }


    shouldComponentUpdate({updateData, invisibleUpdateData}) {
        //check for valid changes in the visible data
        if ((isArray(updateData) && TraceUpdater.#previousLayout !== head(updateData) && updateData !== this.props.updateData)) {

            // console.log(updateData.length < this.props.updateData?.length);
            // console.log(TraceUpdater.#latestUpdate);

            // this is only needed when benchmarking
            if (this.props.verbose){
                // check if we're going from no hidden traces to some hidden traces (== less updateData coming after an 'empty invisible' update)
                if (TraceUpdater.#latestUpdate === 'empty invisible' && updateData.length < this.props.updateData?.length){
                    TraceUpdater.#latestUpdate = 'incomplete visible';
                } else {
                    TraceUpdater.#latestUpdate = 'visible';
                }
                console.time('render time (visible)');

                // console.log(TraceUpdater.#latestUpdate);
            } else {
                // visible by default
                TraceUpdater.#latestUpdate = 'visible';
            }
            TraceUpdater.#valid = true;
            return true;
        }
        //find a condition that covers when the invisible update is empty... but the visible update data is COMPLETE
        else if (TraceUpdater.#latestUpdate === 'visible' && !invisibleUpdateData && this.props.verbose){
            console.timeEnd('time (invisible)');
            console.timeEnd('time (full)');

            TraceUpdater.#latestUpdate = 'empty invisible';
            console.log('render time (invisible): None');
            TraceUpdater.#valid = false;

            return false;
        }
        else if (isArray(invisibleUpdateData) && invisibleUpdateData !== this.props.invisibleUpdateData ) {
            if (this.props.verbose) {
                console.time('render time (invisible)');
            }
            TraceUpdater.#latestUpdate = 'invisible';
            // console.log('invisible was changed');
            TraceUpdater.#valid = true;

            return true;
        }
        //removed statement that reverts the change back to null every time
        TraceUpdater.#valid = false;

        return false;
    }


    render() {
        // VALIDATION //
        const {
            id,
            gdID,
            sequentialUpdate,
            updateData,
            invisibleUpdateData,
            visibleUpdate,
            verbose,
            setProps,
        } = this.props;
        const idDiv = <div id={id}></div>;
        if (!TraceUpdater.#valid) {
            return idDiv;
        }

        // see this link for more information https://stackoverflow.com/a/34002028
        let graphDiv = document?.querySelectorAll('div[id*="' + gdID + '"][class*="dash-graph"]');
        if (graphDiv.length > 1) {
            throw new SyntaxError('TraceUpdater: multiple graphs with ID="' + gdID + '" found; n=' + graphDiv.length + ' \n(either multiple graphs with same ID\'s or current ID is a str-subset of other graph IDs)');
        } else if (graphDiv.length < 1) {
            throw new SyntaxError('TraceUpdater: no graphs with ID="' + gdID + '" found');
        }

        graphDiv = graphDiv?.[0]?.getElementsByClassName('js-plotly-plot')?.[0];
        if (!isElement(graphDiv)) {
            throw new Error(`Invalid gdID '${gdID}'`);
        }

        let traces;
        if (TraceUpdater.#latestUpdate === 'invisible') {
            // console.log('time to update the invisibles');
            traces = filterTraces(tail(invisibleUpdateData));

        }
        if (TraceUpdater.#latestUpdate === 'visible' || TraceUpdater.#latestUpdate === 'incomplete visible') {
            // console.log('time to update the visibles');
            TraceUpdater.#previousLayout = head(updateData);
            traces = filterTraces(tail(updateData));
            //measure of precaution since this.props.visibleUpdate is undefined at first :grin:
            setProps({visibleUpdate: visibleUpdate + 1 || this.visibleUpdate + 1});

        }
        // EXECUTION //
        if (sequentialUpdate) {
            formatTraces(traces).forEach(trace => plotlyRestyle(graphDiv, trace));
        } else {
            plotlyRestyle(graphDiv, mergeTraces(traces));
        }

        if (verbose) {
            if (TraceUpdater.#latestUpdate === 'visible' || TraceUpdater.#latestUpdate === 'incomplete visible') {
                console.timeEnd('time (visible)');
                console.timeEnd('render time (visible)');
                // console.log('zoom in (invisible)');
                console.time('time (invisible)');

            }
            if (TraceUpdater.#latestUpdate === 'invisible') {
                console.timeEnd('time (invisible)');
                console.timeEnd('render time (invisible)');
                console.timeEnd('time (full)');
            }
        }
        return idDiv;
    }
}

TraceUpdater.defaultProps = {
    sequentialUpdate: false,
    verbose: false,
};

TraceUpdater.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks.
     */
    id: PropTypes.string,

    /**
     * The id of the graph-div whose traces should be updated.
     *
     * .. Note:
     *
     *   * if you use multiple graphs; each graph MUST have a unique id; otherwise we
     *     cannot guarantee that resampling will work correctly.
     *   * TraceUpdater will determine the html-graph-div by performing partial matching
     *     on the "id" property (using `gdID`) of all divs with classname="dash-graph".
     *     It will select the first item of that match list; so if multiple same
     *     graph-div IDs are used, or one graph-div-ID is a subset of the other (partial
     *     matching) there is no guarantee that the correct div will be selected.
     */
    gdID: PropTypes.string.isRequired,

    /**
     * Bool indicating whether the figure should be redrawn sequentially (i.e.)
     * calling the restyle multiple times or at once.
     * (still needs to be determined which is faster has the lowest memory peak),
     * by default False.
     */
    sequentialUpdate: PropTypes.bool,

    /**
     * The data to update the graph with, must contain the `index` property for
     * each trace; either a list of dict-traces or a single trace
     */
    updateData: PropTypes.array,

    /**
     * The data to update the graph with, must contain the `index` property for
     * each invisible trace; either a list of dict-traces or a single trace
     */
    invisibleUpdateData: PropTypes.array,

    /**
     * Counter property meant to be the trigger for chained callback, will only
     * be updated after the updateData changed
     */
    visibleUpdate: PropTypes.number,

    /**
     * Flag that turns on console timing. The timer for the visible update
     * should be started externally (with a webdriver or a JS script in Python)
     * so the internal render timing can work.
     */
    verbose: PropTypes.bool,

    /**
     * Dash-assigned callback that should be called to report property changes
     * to Dash, to make them available for callbacks.
     */
    setProps: PropTypes.func,
};