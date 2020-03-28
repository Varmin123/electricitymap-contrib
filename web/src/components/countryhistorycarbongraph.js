import moment from 'moment';
import React, { useMemo, useState } from 'react';
import { connect } from 'react-redux';

import { CARBON_GRAPH_LAYER_KEY } from '../helpers/constants';
import { getCo2Scale } from '../helpers/scales';
import {
  getSelectedZoneHistory,
  getZoneHistoryStartTime,
  getZoneHistoryEndTime,
} from '../selectors';
import {
  createSingleLayerGraphBackgroundMouseMoveHandler,
  createSingleLayerGraphBackgroundMouseOutHandler,
  createGraphLayerMouseMoveHandler,
  createGraphLayerMouseOutHandler,
} from '../helpers/history';

import AreaGraph from './graph/areagraph';

const prepareGraphData = (historyData, colorBlindModeEnabled, electricityMixMode, carbonIntensityDomain) => {
  if (!historyData || !historyData[0]) return {};

  const co2ColorScale = getCo2Scale(colorBlindModeEnabled, carbonIntensityDomain);
  const data = historyData.map(d => ({
    [CARBON_GRAPH_LAYER_KEY]: electricityMixMode === 'consumption'
      ? d[1]['totalFootprintMegatonsCO2']
      : d[1]['totalEmissionsMegatonsCO2'],
    datetime: moment(d[0]).toDate(),
    // Keep a pointer to original data
    _countryData: d,
  }));
  const layerKeys = [CARBON_GRAPH_LAYER_KEY];
  const layerFill = key => d => co2ColorScale(d.data[key]);
  return { data, layerKeys, layerFill };
};

const mapStateToProps = state => ({
  colorBlindModeEnabled: state.application.colorBlindModeEnabled,
  electricityMixMode: state.application.electricityMixMode,
  startTime: getZoneHistoryStartTime(state),
  endTime: getZoneHistoryEndTime(state),
  historyData: getSelectedZoneHistory(state),
  isMobile: state.application.isMobile,
  selectedTimeIndex: state.application.selectedZoneTimeIndex,
  carbonIntensityDomain: state.application.carbonIntensityDomain,
});

const CountryHistoryCarbonGraph = ({
  colorBlindModeEnabled,
  electricityMixMode,
  startTime,
  endTime,
  historyData,
  isMobile,
  selectedTimeIndex,

  carbonIntensityDomain,
}) => {
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(null);

  // Recalculate graph data only when the history data is changed
  const { data, layerKeys, layerFill } = useMemo(
    () => prepareGraphData(historyData, colorBlindModeEnabled, electricityMixMode, carbonIntensityDomain),
    [historyData, colorBlindModeEnabled, electricityMixMode, carbonIntensityDomain]
  );

  // Mouse action handlers
  const backgroundMouseMoveHandler = useMemo(
    () => createSingleLayerGraphBackgroundMouseMoveHandler(isMobile, setSelectedLayerIndex),
    [isMobile, setSelectedLayerIndex]
  );
  const backgroundMouseOutHandler = useMemo(
    () => createSingleLayerGraphBackgroundMouseOutHandler(setSelectedLayerIndex),
    [setSelectedLayerIndex]
  );
  const layerMouseMoveHandler = useMemo(
    () => createGraphLayerMouseMoveHandler(isMobile, setSelectedLayerIndex),
    [isMobile, setSelectedLayerIndex]
  );
  const layerMouseOutHandler = useMemo(
    () => createGraphLayerMouseOutHandler(setSelectedLayerIndex),
    [setSelectedLayerIndex]
  );

  return (
    <AreaGraph
      data={data}
      layerKeys={layerKeys}
      layerFill={layerFill}
      startTime={startTime}
      endTime={endTime}
      valueAxisLabel="g / kWh"
      backgroundMouseMoveHandler={backgroundMouseMoveHandler}
      backgroundMouseOutHandler={backgroundMouseOutHandler}
      layerMouseMoveHandler={layerMouseMoveHandler}
      layerMouseOutHandler={layerMouseOutHandler}
      selectedTimeIndex={selectedTimeIndex}
      selectedLayerIndex={selectedLayerIndex}
      isMobile={isMobile}
      height="8em"
    />
  );
};

export default connect(mapStateToProps)(CountryHistoryCarbonGraph);
