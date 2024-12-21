import React, { Component } from 'react'
import { Text, StyleSheet, View } from 'react-native'

export default class App extends Component {
  render() {
    return (
      <View style = {styles.container}>
        <Text> textInComponent </Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  }

})
