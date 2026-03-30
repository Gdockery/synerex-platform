"""
SQLAlchemy models - populated in Phase 2.
"""
from app.extensions import db
from app.models.base import BaseModel
from app.models.client import Client
from app.models.user import User
from app.models.project import Project, project_user
from app.models.xeco import CompanySettings
from app.models.gateway import Gateway
from app.models.repeater import Repeater
from app.models.switch import Switch
from app.models.meter import Meter
from app.models.meter_data import MeterData
from app.models.equipment_data import EquipmentData
from app.models.meter_data_aggregate import MeterDataAggregate
from app.models.per_meter_data_aggregate import PerMeterDataAggregate
from app.models.schedule import Schedule
from app.models.switch_command import SwitchCommand
from app.models.test import Test, gateway_test
from app.models.meter_alert_group import MeterAlertGroup, meter_alert_group_user
from app.models.meter_alert import MeterAlert
from app.models.meter_alert_event import MeterAlertEvent
from app.models.repeater_alert_group import RepeaterAlertGroup, repeater_alert_group_user
from app.models.repeater_alert import RepeaterAlert
from app.models.repeater_alert_event import RepeaterAlertEvent
from app.models.switch_alert_group import SwitchAlertGroup
from app.models.switch_alert import SwitchAlert
from app.models.switch_alert_event import SwitchAlertEvent
from app.models.gateway_command import GatewayCommand
from app.models.meter_csv import MeterCSV
from app.models.savings_report import SavingsReport
from app.models.report_data import ReportData
from app.models.file import File
from app.models.service_plan import ServicePlan
from app.models.pi_board import PiBoard
from app.models.emv_analysis import EmvAnalysis
from app.models.oem_branding import OemBranding