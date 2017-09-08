from framework.routes import get, post, abort
from framework.session import get_current_user
from database.my_recently_created import get_my_recently_created_units
from database.unit import deliver_unit, insert_unit, get_latest_accepted_unit
from database.subject import deliver_subject, list_subjects_by_unit_flat
from copy import deepcopy
from database.unit import list_required_units, list_required_by_units, \
    list_latest_accepted_units, list_one_unit_versions, get_unit_version, \
    insert_unit_version


@get('/s/units/{unit_id}')
def get_unit_route(request, unit_id):
    """
    Get a specific unit given an ID.
    """

    db_conn = request['db_conn']
    unit = get_latest_accepted_unit(db_conn, unit_id)
    if not unit:
        return abort(404)
    # TODO-2 SPLITUP create new endpoints for these instead
    requires = list_required_units(db_conn, unit_id)
    required_by = list_required_by_units(db_conn, unit_id)
    subjects = list_subjects_by_unit_flat(db_conn, unit_id)
    return 200, {
        'unit': deliver_unit(unit),
        # TODO-3 unit parameters
        'requires': [deliver_unit(require) for require in requires],
        'required_by': [deliver_unit(require) for require in required_by],
        'belongs_to': [deliver_subject(subject) for subject in subjects],
    }


@get('/s/units')
def list_units_route(request):
    """
    Return a collection of units by `entity_id`.
    """

    db_conn = request['db_conn']
    entity_ids = request['params'].get('entity_ids')
    if not entity_ids:
        return abort(404)
    entity_ids = entity_ids.split(',')
    units = list_latest_accepted_units(db_conn, entity_ids)
    if not units:
        return abort(404)
    return 200, {'units': [deliver_unit(unit, 'view') for unit in units]}


@get('/s/units/{unit_id}/versions')
def get_unit_versions_route(request, unit_id):
    """
    Get unit versions given an ID. Paginates.
    """

    db_conn = request['db_conn']
    versions = list_one_unit_versions(db_conn, unit_id)
    return 200, {
        'versions': [
            deliver_unit(version, access='view')
            for version in versions
        ]
    }


@get('/s/units/versions/{version_id}')
def get_unit_version_route(request, version_id):
    """
    Get a unit version only knowing the `version_id`.
    """

    db_conn = request['db_conn']
    unit_version = get_unit_version(db_conn, version_id)
    if not unit_version:
        return abort(404)
    return 200, {'version': unit_version}


# TODO-1 move to /s/users/{user_id}/units (?)
@get('/s/units:get_my_recently_created')
def get_my_recently_created_units_route(request):
    """
    Get the units the user most recently created.
    """

    current_user = get_current_user(request)
    if not current_user:
        return abort(401)
    db_conn = request['db_conn']
    units = get_my_recently_created_units(db_conn, current_user)
    return 200, {
        'units': [deliver_unit(unit) for unit in units],
    }


@post('/s/units/versions')
def create_new_unit_version_route(request):
    """
    Create a new unit version for a brand new unit.
    """

    current_user = get_current_user(request)
    if not current_user:
        return abort(401)
    db_conn = request['db_conn']
    data = deepcopy(request['params'])
    if 'entity_id' in data:
        return abort(403)
    data['user_id'] = current_user['id']
    unit, errors = insert_unit(db_conn, data)
    if len(errors):
        return 400, {
            'errors': errors,
            'ref': '9CuN9nYpmBXd45barbfoIe5t',
        }
    return 200, {'version': deliver_unit(unit, 'view')}


@post('/s/units/{unit_id}/versions')
def create_existing_unit_version_route(request, unit_id):
    """
    Create a new unit version for an existing unit.
    """

    current_user = get_current_user(request)
    if not current_user:
        return abort(401)
    db_conn = request['db_conn']
    next_data = deepcopy(request['params'])
    next_data['entity_id'] = unit_id
    next_data['user_id'] = current_user['id']
    current_data = get_latest_accepted_unit(db_conn, unit_id)
    if not current_data:
        return abort(404)
    unit, errors = insert_unit_version(db_conn, current_data, next_data)
    if len(errors):
        return 400, {
            'errors': errors,
            'ref': 'aint3EhS4LkTKuIoY0q07vHZ',
        }
    return 200, {'version': deliver_unit(unit, 'view')}
