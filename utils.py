import requests
import json
import errors
import logging
from tornado import httpclient
from tornado import httputil

async def rest_get_tornado_httpclient(url, user, password):
    http_client = httpclient.AsyncHTTPClient()
    http_request = httpclient.HTTPRequest(url)
    http_request.auth_username = user
    http_request.auth_password = password
    headers = httputil.HTTPHeaders({"content-type": "application/json", "accept": "application/json"})
    http_request.headers = headers
    try:
        response = await http_client.fetch(http_request)
        response_string = str(response.body, 'utf-8')
        if response.code == 200:
            return response_string
        else:
            error_message = "Failed HTTP response...code: " + response.code
            return error_message
    except Exception as err:
        error_message = "Error: %s" % err
        logging.error(error_message)
        return error_message


# TODO: switch this to tornado
def rest_post_json(baseURL, uri, thejson, user, password):
    proxies = {
        "http": None,
        "https": None,
    }
    appformat = 'application/json'
    headers = {'content-type': appformat, 'accept': appformat}
    restURI = baseURL + uri
    logging.info(restURI)
    try:
        r = requests.post(restURI, data=thejson, headers=headers, proxies=proxies, auth=(user, password),
                          verify=False)
        # print "HTTP response code is: " + str(r.status_code)
        if r.status_code == 200:
            return json.dumps(r.json(), indent=2)
        else:
            raise errors.InputError(restURI, "HTTP status code: " + str(r.status_code))
    except errors.InputError as err:
        logging.error("Exception raised: " + str(type(err)))
        logging.error(err.expression)
        logging.error(err.message)
        return