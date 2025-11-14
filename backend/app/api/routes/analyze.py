from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import AnalyzeResponse, ChartData
from app.services.data_processor import DataProcessor
from app.services.chart_generator import ChartGenerator
from app.services.ai_service import AIService
from app.storage import get_upload
from datetime import datetime
from typing import Optional
import os
import pandas as pd

router = APIRouter(prefix="/api", tags=["analyze"])

@router.get("/analyze/{upload_id}", response_model=AnalyzeResponse)
async def analyze_data(
    upload_id: str,
    user_intent: Optional[str] = Query(None, description="Optional: What the user wants to analyze")
):
    """
    Analyze uploaded file and generate charts with AI-powered suggestions.

    Takes an upload_id from a previous /upload call and:
    1. Uses AI to intelligently suggest 3-4 meaningful charts (with optional user intent)
    2. Generates charts based on AI suggestions (fallback to heuristics if AI unavailable)
    3. Generates AI insights for each chart (if API key configured)
    4. Generates global summary (if API key configured)
    """

    # Get upload data from storage
    upload_data = get_upload(upload_id)
    if not upload_data:
        raise HTTPException(
            status_code=404,
            detail=f"Upload ID {upload_id} not found"
        )

    try:
        # Get data from storage (already parsed)
        df = upload_data["dataframe"]
        schema = upload_data["schema"]
        filename = upload_data["filename"]

        print(f"[Analyze] Starting analysis for upload_id={upload_id}, filename={filename}, user_intent={user_intent}")
        print(f"[Analyze] Dataset: {schema.row_count} rows, {len(schema.columns)} columns")

        ai_service = AIService()
        charts = []
        global_summary = None

        # Step 1: Get AI chart suggestions (if enabled)
        if ai_service.enabled:
            try:
                print(f"[Analyze] AI enabled - getting chart suggestions (user_intent: {user_intent})")
                chart_suggestions = ai_service.suggest_charts(schema, user_intent)
                print(f"[Analyze] Received {len(chart_suggestions)} chart suggestions from AI")

                if chart_suggestions:
                    # Generate charts based on AI suggestions
                    print(f"[Analyze] Generating charts from AI suggestions using ChartGenerator")
                    chart_generator = ChartGenerator()
                    charts_data = chart_generator.generate_charts_from_suggestions(
                        df, schema, chart_suggestions
                    )
                    charts = [ChartData(**chart) for chart in charts_data]
                    print(f"[Analyze] ✓ Successfully generated {len(charts)} charts from AI suggestions")
                else:
                    print("[Analyze] ⚠ No AI chart suggestions returned, falling back to heuristics")
                    # Fallback to heuristics if AI returns empty
                    chart_generator = ChartGenerator()
                    charts_data = chart_generator.generate_charts(df, schema, max_charts=4)
                    charts = [ChartData(**chart) for chart in charts_data]
                    print(f"[Analyze] ✓ Generated {len(charts)} charts using heuristics")

            except Exception as e:
                print(f"[Analyze] ✗ AI chart suggestions failed: {e}, falling back to heuristics")
                import traceback
                traceback.print_exc()
                # Fallback to heuristics if AI fails
                chart_generator = ChartGenerator()
                charts_data = chart_generator.generate_charts(df, schema, max_charts=4)
                charts = [ChartData(**chart) for chart in charts_data]
                print(f"[Analyze] ✓ Generated {len(charts)} charts using heuristics (fallback)")
        else:
            # No AI available, use heuristics
            print("[Analyze] AI not enabled, using heuristic-based chart generation")
            chart_generator = ChartGenerator()
            charts_data = chart_generator.generate_charts(df, schema, max_charts=4)
            charts = [ChartData(**chart) for chart in charts_data]
            print(f"[Analyze] ✓ Generated {len(charts)} charts using heuristics")

        # Step 2: Generate AI insights for each chart (if enabled)
        if ai_service.enabled and charts:
            try:
                print(f"[Analyze] Generating AI insights for {len(charts)} charts")
                # Generate insight for each chart by creating new chart objects
                charts_with_insights = []
                for idx, chart in enumerate(charts):
                    insight = ai_service.generate_chart_insight(chart, schema)
                    # Create new chart with insight
                    chart_dict = chart.model_dump()
                    chart_dict['insight'] = insight
                    charts_with_insights.append(ChartData(**chart_dict))
                    print(f"[Analyze] Generated insight for chart {idx + 1}/{len(charts)}: {chart.title}")

                # Replace charts with versions that have insights
                charts = charts_with_insights

                # Generate global summary
                print(f"[Analyze] Generating global summary")
                global_summary = ai_service.generate_global_summary(charts, schema)
                print(f"[Analyze] ✓ Successfully generated global summary")

            except Exception as e:
                print(f"[Analyze] ⚠ AI insights generation failed: {e}")
                import traceback
                traceback.print_exc()
                # Continue without insights (graceful degradation)

        print(f"[Analyze] ✓ Analysis complete: {len(charts)} charts generated")
        return AnalyzeResponse(
            upload_id=upload_id,
            filename=filename,
            data_schema=schema,
            charts=charts,
            upload_timestamp=upload_data["timestamp"],
            global_summary=global_summary
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing file: {str(e)}"
        )
