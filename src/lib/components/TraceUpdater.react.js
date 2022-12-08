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
    nth,
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

    shouldComponentUpdate({visibleUpdateData, invisibleUpdateData}) {
        // console.log("checking if the update should go through")
        if ((isArray(visibleUpdateData) && TraceUpdater.#previousLayout !== head(visibleUpdateData) && visibleUpdateData !== this.props.visibleUpdateData)) {
            TraceUpdater.#latestUpdate = 'visible';
            // console.log('visible was changed');
            // console.log(visibleUpdateData !== this.props.visibleUpdateData);
            // console.log(TraceUpdater.#latestUpdate);
            return true;
        } else if (isArray(invisibleUpdateData) && invisibleUpdateData !== this.props.invisibleUpdateData) {
            TraceUpdater.#latestUpdate = 'invisible';
            // console.log('invisible was changed');
            // console.log(invisibleUpdateData);
            // console.log(invisibleUpdateData !== this.props.invisibleUpdateData);
            return true;
        }
        // return ((isArray(visibleUpdateData) && TraceUpdater.#previousLayout !== head(visibleUpdateData)) || (isArray(invisibleUpdateData) && TraceUpdater.#previousLayout === head(invisibleUpdateData)));
        TraceUpdater.#latestUpdate = null;
        return false;
    }


    render() {
        // VALIDATION //
        const {
            id,
            gdID,
            sequentialUpdate,
            visibleUpdateData,
            invisibleUpdateData,
            visibleUpdates,
            invisibleUpdates,
            setProps,
        } = this.props;
        const idDiv = <div id={id}></div>;
        if (!TraceUpdater.#latestUpdate) {
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
        // console.log(`visibleUpdates: ${visibleUpdates} & invisibleUpdates: ${invisibleUpdates}`);
        //check the visible traces have been updated yet
        if (TraceUpdater.#latestUpdate === 'invisible') {
            // console.log('time to update the invisibles');
            traces = filterTraces(tail(invisibleUpdateData));
            setProps({invisibleUpdates: invisibleUpdates + 1});
        }
        if (TraceUpdater.#latestUpdate === 'visible') {
            // console.log('time to update the visibles');
            TraceUpdater.#previousLayout = head(visibleUpdateData);
            traces = filterTraces(tail(visibleUpdateData));
        }
        // EXECUTION //
        if (sequentialUpdate) {
            formatTraces(traces).forEach(trace => plotlyRestyle(graphDiv, trace));
        } else {
            plotlyRestyle(graphDiv, mergeTraces(traces));
        }
        return idDiv;
    }
}

TraceUpdater.defaultProps = {
    sequentialUpdate: false,
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

    // /**
    //  * Counter keeping track of how many updates were made on the visible traces
    //  */
    // visibleUpdates: PropTypes.number,
    //
    // /**
    //  * Counter keeping track of how many updates were made on the invisible traces
    //  */
    // invisibleUpdates: PropTypes.number,

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
    visibleUpdateData: PropTypes.array,

    /**
     * The data to update the graph with, must contain the `index` property for
     * each invisible trace; either a list of dict-traces or a single trace
     */
    invisibleUpdateData: PropTypes.array,


    /**
     * Dash-assigned callback that should be called to report property changes
     * to Dash, to make them available for callbacks.
     */
    setProps: PropTypes.func,
};