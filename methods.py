import json
import logging
import utils
import subprocess

async def send_async_request(url, user, password):
    response_json_list = []
    try:
        response = await utils.rest_get_tornado_httpclient(url, user, password)
        response_json = json.loads(response)
        if type(response_json) is dict:
            response_json_list.append(response_json)
            response = json.dumps(response_json_list, indent=2, sort_keys=True)
        with open("jsongets/response.json", 'w', encoding="utf8") as f:
            # json.dump(response, f, sort_keys=True, indent=4, separators=(',', ': '))
            f.write(response)
            f.close()
        result = {'action': 'collect', 'status': 'completed', 'body': response}
        return result
    except Exception as err:
        result = {'action': 'collect', 'status': 'failed', 'body': response}
        logging.info(response)
        return result

def run_command(cmd, cmd_arg):
    try:
        response = subprocess.run([cmd, cmd_arg], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        result = {'action': 'collect', 'status': 'completed', 'body': response.stdout.decode('utf-8')}
        return result
    except Exception as err:
        result = {'action': 'collect', 'status': 'failed', 'body': err.strerror}
        logging.info(err)
        return result

def get_response():
    with open("jsongets/response.json", 'r', ) as f:
        response = json.load(f)
        f.close()
    return json.dumps(response)


def process_ws_message(message):
    response = "Got the message from websocket, here's my reply"
    return response
