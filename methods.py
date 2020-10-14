import json
import logging
import utils
from subprocess import Popen, PIPE, STDOUT


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


def run_command(ajax_handler, cmd, cmd_arg):
    try:
        cmd_process = Popen([cmd, cmd_arg], stdin=PIPE, stdout=PIPE, stderr=STDOUT)
        stdout_text = ""
        ajax_handler.send_message_open_ws("Executing collection script...")
        i = 0
        for line in cmd_process.stdout:
            i += 1
            logging.info(line.decode('utf-8'))
            stdout_text += line.decode('utf-8')
            if i%10 == 0:
                ajax_handler.send_message_open_ws("script progressing...")
        result = {'action': 'collect', 'status': 'completed', 'body': 'Successfully executed command on the server.'}
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
