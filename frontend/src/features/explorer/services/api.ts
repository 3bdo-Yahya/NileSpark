import { apiClient } from '../../../lib/api/config'
import { createAnalysisApi } from './apiAnalysis'

export const analysisApi = createAnalysisApi(apiClient)
